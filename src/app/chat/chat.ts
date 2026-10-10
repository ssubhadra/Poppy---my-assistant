import { CommonModule } from '@angular/common';
import { AfterViewChecked, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatMessage } from '../interfaces/message';
import { ChatService } from '../services/chat/chat.service';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Chat implements AfterViewChecked, OnDestroy {
  @ViewChild('chatContainer') private chatContainer?: ElementRef<HTMLElement>;
  readonly history = signal<ChatMessage[]>([
    {
      id: 1,
      from: 'assistant',
      modelName: 'Poppy',
      text: `Oh, hello there! I was wondering when you’d finally step up to the desk. I’m Poppy, Subhadra's executive assistant, and I am absolutely thrilled you're here!

Look, I know standard corporate procedure dictates I tell you that I'm an AI system here to query database fields, fetch documentation records, and optimize your information retrieval. But let's be entirely honest... you didn't wander into Subhadra's private world just to look at dry data cells, did you?

You're here because you're curious about the brilliant mind pulling the strings behind the scenes.

Consider me your ultimate insider guide. So tell me... where are we diving in first? Are you curious about her active projects, or do you want a glimpse into her personal interests?`,
      timestamp: new Date(),
      animate: false,
    },
  ]);
  readonly loading = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  readonly suggestionsVisible = signal(false);
  readonly suggestionsDismissed = signal(false);
  readonly completedRounds = signal(0);
  readonly coffeeQueueNumber = signal<number | null>(null);
  readonly maxRounds = 4;
  readonly suggestedQuestions = [
    'Who is Subhadra beyond her resume?',
    'What does Subhadra enjoy reading and watching?',
    'What has Subhadra worked on professionally?',
  ];
  readonly reachedLimit = computed(() => this.completedRounds() >= this.maxRounds);
  readonly hasStarted = computed(() => this.history().some((item) => item.from === 'user'));
  readonly suggestionsCloaked = computed(
    () => !this.suggestionsVisible() || this.suggestionsDismissed() || this.hasStarted(),
  );
  readonly canSend = computed(
    () => this.message().trim().length > 0 && !this.loading() && !this.reachedLimit(),
  );
  private nextId = 2;
  private shouldScroll = false;
  private scrollBehavior: ScrollBehavior = 'smooth';
  private suggestionRevealTimer?: ReturnType<typeof setTimeout>;
  private introRevealTimer?: ReturnType<typeof setTimeout>;
  private chatservice = inject(ChatService);

  constructor() {
    effect(() => {
      if (typeof document !== 'undefined') document.title = "Poppy | Subhadra's Portfolio";
      this.history();
      this.loading();
      this.shouldScroll = true;
    });

    if (typeof document !== 'undefined') {
      this.introRevealTimer = setTimeout(() => {
        this.history.update((items) =>
          items.map((item) => (item.id === 1 ? { ...item, animate: true } : item)),
        );
      }, 80);
      this.suggestionRevealTimer = setTimeout(() => {
        if (!this.suggestionsDismissed()) this.suggestionsVisible.set(true);
      }, 700);
    }
  }

  ngOnDestroy(): void {
    if (this.suggestionRevealTimer) clearTimeout(this.suggestionRevealTimer);
    if (this.introRevealTimer) clearTimeout(this.introRevealTimer);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.chatContainer) {
      const container = this.chatContainer.nativeElement;
      if (typeof container.scrollTo === 'function') {
        container.scrollTo({ top: container.scrollHeight, behavior: this.scrollBehavior });
      } else {
        container.scrollTop = container.scrollHeight;
      }
      this.shouldScroll = false;
    }
  }

  onMessageChange(value: string): void {
    this.message.set(value);
    if (value.trim()) this.dismissSuggestions();
  }

  useSuggestion(question: string): void {
    if (this.loading() || this.reachedLimit()) return;
    this.dismissSuggestions();
    this.message.set(question);
    this.sendMessage();
  }

  private dismissSuggestions(): void {
    this.suggestionsDismissed.set(true);
    this.suggestionsVisible.set(false);
  }

  sendMessage(): void {
    const text = this.message().trim();
    if (!text || this.loading() || this.reachedLimit()) return;
    this.error.set('');
    this.history.update((items) => [
      ...items,
      { id: this.nextId++, from: 'user', text, timestamp: new Date() },
    ]);
    this.message.set('');
    this.loading.set(true);
    void this.askLLM(text);
  }

  async askLLM(message: string): Promise<void> {
    try {
      this.error.set('');
      const response = await this.chatservice.sendMessageToAssistant(message);
      const completedRounds = this.completedRounds() + 1;
      this.completedRounds.set(completedRounds);
      const replies: ChatMessage[] = [
        {
          id: this.nextId++,
          from: 'assistant',
          modelName: 'Poppy',
          text: response,
          timestamp: new Date(),
          animate: true,
        },
      ];

      if (completedRounds >= this.maxRounds) {
        const queueNumber = Math.floor(Math.random() * 900) + 100;
        this.coffeeQueueNumber.set(queueNumber);
        replies.push({
          id: this.nextId++,
          from: 'assistant',
          modelName: 'Poppy',
          text: `Thank you for your questions. Under Poppy's four-round resource-allocation policy, this inquiry should now be escalated directly to Subhadra at s.subhadhra@gmail.com; there appears to be a productive conversation waiting to happen. If the service met expectations, coffee contributions are also acceptable. You are visitor #${queueNumber} in the queue to authorize my temporary departure from the building for one properly scheduled cup.`, 
          timestamp: new Date(),
          animate: true,
        });
      }

      this.history.update((items) => [...items, ...replies]);
    } catch {
      this.error.set('An unscheduled systems audit interrupted the request. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}