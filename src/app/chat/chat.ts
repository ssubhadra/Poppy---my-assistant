import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  afterNextRender,
  afterRenderEffect,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatMessage } from '../interfaces/message';
import { ChatService } from '../services/chat/chat.service';
import { Presence } from './presence';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule, Presence],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css', './identity.css', './conversation.css', './choreography.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Chat implements OnDestroy {
  @ViewChild('chatContainer') private chatContainer?: ElementRef<HTMLElement>;
  @ViewChild('messageInput') private messageInput?: ElementRef<HTMLInputElement>;
  readonly introTitle = "Hey. You're here.";
  readonly introBody =
    "I'm Poppy. Subhadra's assistant, and your company here.\n\nAsk about her work, what she's into, or whatever brought you here. We can let the conversation find its own way.";
  readonly introText = this.introTitle + '\n' + this.introBody;
  readonly introPhase = signal<'arriving' | 'typing' | 'receding' | 'ready'>('arriving');
  readonly introTyped = signal('');
  readonly introTitleVisible = computed(() => this.introTyped().slice(0, this.introTitle.length));
  readonly introBodyVisible = computed(() => this.introTyped().slice(this.introTitle.length + 1));
  readonly composerReady = computed(() => this.introPhase() === 'ready');
  readonly history = signal<ChatMessage[]>([]);
  readonly loading = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  readonly failedMessage = signal('');
  readonly replyArriving = signal(false);
  readonly typingReplyId = signal<number | null>(null);
  readonly replyVisibleText = signal('');
  readonly announcement = signal('');
  readonly motionPaused = signal(false);
  readonly reducedMotion = signal(false);
  readonly motionEnabled = computed(() => !this.motionPaused() && !this.reducedMotion());
  readonly hasStarted = computed(() => this.history().some((item) => item.from === 'user'));
  readonly responding = computed(() => this.loading() || this.typingReplyId() !== null);
  readonly canSend = computed(
    () => this.composerReady() && this.message().trim().length > 0 && !this.responding(),
  );
  readonly status = computed(() =>
    !this.composerReady()
      ? 'A little hello'
      : this.loading()
        ? 'Thinking it through'
        : this.typingReplyId() !== null
          ? 'Replying to you'
          : this.replyArriving()
            ? 'A thought, for you'
            : 'Right here with you',
  );
  readonly topics = [
    {
      number: '01',
      title: 'The things I make',
      question: 'What has Subhadra worked on professionally?',
    },
    {
      number: '02',
      title: 'The things I love',
      question: "What are Subhadra's personal interests and hobbies?",
    },
    {
      number: '03',
      title: 'What inspires me',
      question: 'What does Subhadra enjoy reading and watching?',
    },
  ];
  private readonly chatService = inject(ChatService);
  private readonly document = inject(DOCUMENT);
  private nextId = 1;
  private followLatest = true;
  private focusComposer = false;
  private initialized = false;
  private introTimer?: ReturnType<typeof setTimeout>;
  private typingTimer?: ReturnType<typeof setTimeout>;
  private replyTimer?: ReturnType<typeof setTimeout>;
  private finishTyping?: () => void;
  private motionQuery?: MediaQueryList;
  private destroyed = false;
  private readonly onMotionChange = (event: MediaQueryListEvent) =>
    this.reducedMotion.set(event.matches);

  constructor() {
    afterRenderEffect(() => {
      this.history();
      this.loading();
      this.replyVisibleText();
      this.composerReady();
      this.updateRenderedView();
    });
    effect(() => {
      if (!this.motionEnabled() && this.initialized) {
        this.skipIntro();
        this.finishTyping?.();
      }
    });
    // Start only after hydration, keeping server and client markup identical.
    afterNextRender(() => {
      this.initialized = true;
      this.document.title = 'Subhadra, as I am — with Poppy';
      this.motionQuery = this.document.defaultView?.matchMedia?.(
        '(prefers-reduced-motion: reduce)',
      );
      this.reducedMotion.set(this.motionQuery?.matches ?? false);
      this.motionQuery?.addEventListener('change', this.onMotionChange);
      if (!this.motionEnabled()) {
        this.skipIntro();
        return;
      }
      this.introTimer = setTimeout(() => this.typeIntroduction(), 520);
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    clearTimeout(this.introTimer);
    clearTimeout(this.typingTimer);
    clearTimeout(this.replyTimer);
    this.finishTyping = undefined;
    this.motionQuery?.removeEventListener('change', this.onMotionChange);
  }

  private updateRenderedView(): void {
    if (this.followLatest && this.chatContainer) {
      const container = this.chatContainer.nativeElement;
      if (typeof container.scrollTo === 'function') {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: this.motionEnabled() && this.typingReplyId() === null ? 'smooth' : 'auto',
        });
      } else container.scrollTop = container.scrollHeight;
    }
    if (this.focusComposer && this.composerReady() && this.messageInput) {
      this.messageInput.nativeElement.focus({ preventScroll: true });
      this.focusComposer = false;
    }
  }

  onTranscriptScroll(): void {
    const element = this.chatContainer?.nativeElement;
    if (element)
      this.followLatest = element.scrollHeight - element.scrollTop - element.clientHeight < 64;
  }

  toggleMotion(): void {
    this.motionPaused.update((paused) => !paused);
  }

  skipIntro(): void {
    if (this.composerReady()) return;
    clearTimeout(this.introTimer);
    clearTimeout(this.typingTimer);
    this.finishTyping = undefined;
    this.introTyped.set(this.introText);
    this.openComposer();
  }

  private typeIntroduction(): void {
    this.introPhase.set('typing');
    this.typeText(
      this.introText,
      (text) => this.introTyped.set(text),
      () => {
        this.introPhase.set('receding');
        this.announcement.set(this.introText);
        if (!this.motionEnabled()) this.openComposer();
        else this.introTimer = setTimeout(() => this.openComposer(), 650);
      },
      3400,
    );
  }

  private openComposer(): void {
    const activeElement = this.document.activeElement;
    this.focusComposer =
      !activeElement ||
      activeElement === this.document.body ||
      activeElement.classList.contains('intro-skip');
    this.introPhase.set('ready');
    this.announcement.set(this.introText);
  }

  // The API returns a complete reply; this is its presentation, not network streaming.
  private typeText(
    text: string,
    update: (value: string) => void,
    done: () => void,
    duration: number,
  ): void {
    clearTimeout(this.typingTimer);
    const characters = Array.from(text);
    const started = Date.now();
    this.finishTyping = () => {
      clearTimeout(this.typingTimer);
      this.finishTyping = undefined;
      update(text);
      done();
    };
    if (!this.motionEnabled() || !characters.length) {
      this.finishTyping();
      return;
    }
    const tick = () => {
      if (this.destroyed) return;
      const count = Math.min(
        characters.length,
        Math.floor(((Date.now() - started) / duration) * characters.length),
      );
      update(characters.slice(0, count).join(''));
      if (count >= characters.length) this.finishTyping?.();
      else this.typingTimer = setTimeout(tick, 24);
    };
    tick();
  }

  useSuggestion(question: string): void {
    if (!this.composerReady() || this.responding()) return;
    this.messageInput?.nativeElement.focus({ preventScroll: true });
    this.message.set(question);
    this.sendMessage();
  }

  sendMessage(): void {
    if (!this.canSend()) return;
    this.followLatest = true;
    const text = this.message().trim();
    this.history.update((items) => [
      ...items,
      { id: this.nextId++, from: 'user', text, timestamp: new Date() },
    ]);
    this.message.set('');
    void this.askLLM(text);
  }

  retryMessage(): void {
    if (!this.responding() && this.failedMessage()) {
      this.followLatest = true;
      void this.askLLM(this.failedMessage());
    }
  }

  private async askLLM(message: string): Promise<void> {
    this.error.set('');
    this.failedMessage.set('');
    this.announcement.set('');
    this.loading.set(true);
    this.replyArriving.set(false);
    clearTimeout(this.replyTimer);
    try {
      const response = await this.chatService.sendMessageToAssistant(message);
      if (this.destroyed) return;
      const id = this.nextId++;
      this.typingReplyId.set(id);
      this.replyVisibleText.set('');
      this.history.update((items) => [
        ...items,
        {
          id,
          from: 'assistant',
          modelName: 'Poppy',
          text: response,
          timestamp: new Date(),
          animate: true,
        },
      ]);
      this.replyArriving.set(true);
      this.typeText(
        response,
        (text) => this.replyVisibleText.set(text),
        () => {
          this.typingReplyId.set(null);
          this.announcement.set(response);
          this.replyTimer = setTimeout(() => this.replyArriving.set(false), 1800);
        },
        Math.min(4200, Math.max(700, Array.from(response).length * 12)),
      );
    } catch {
      if (this.destroyed) return;
      this.error.set("That reply didn't make it through. Give it another try.");
      this.failedMessage.set(message);
    } finally {
      if (!this.destroyed) this.loading.set(false);
    }
  }
}
