import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Chat } from './chat';
import { ChatService } from '../services/chat/chat.service';

describe('Poppy shared experience', () => {
  let component: Chat;
  let fixture: ComponentFixture<Chat>;
  let send: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    send = vi.fn().mockResolvedValue('Here is a little about Subhadra.');
    await TestBed.configureTestingModule({
      imports: [Chat],
      providers: [{ provide: ChatService, useValue: { sendMessageToAssistant: send } }],
    }).compileComponents();
    fixture = TestBed.createComponent(Chat);
    component = fixture.componentInstance;
    component.motionPaused.set(true);
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the full greeting and composer immediately with motion disabled', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('As I am.');
    expect(element.querySelector('app-presence')).not.toBeNull();
    expect(element.querySelector('#chat-message')).not.toBeNull();
    expect(element.querySelector('.conversation-header')).toBeNull();
    expect(element.querySelector('.first-thought')).not.toBeNull();
    expect(component.history()).toHaveLength(0);
    expect(send).not.toHaveBeenCalled();
    expect(component.composerReady()).toBe(true);
    expect(component.introTyped()).toBe(component.introText);
    expect(element.querySelector('.brand-symbol')?.textContent).toBe('ψ');
  });

  it('keeps the same scene, assistant, and input when a conversation starts', async () => {
    const element = fixture.nativeElement as HTMLElement;
    const scene = element.querySelector('main');
    const presence = element.querySelector('app-presence');
    const composer = element.querySelector('#chat-message');
    const greeting = element.querySelector('.first-thought');
    component.message.set('Hello Poppy');
    component.sendMessage();
    await fixture.whenStable();
    expect(element.querySelector('main')).toBe(scene);
    expect(element.querySelector('app-presence')).toBe(presence);
    expect(element.querySelector('#chat-message')).toBe(composer);
    expect(element.querySelector('.first-thought')).toBe(greeting);
    expect(send).toHaveBeenCalledWith('Hello Poppy');
    expect(component.history()).toHaveLength(2);
  });

  it('sends a topic in place and focuses the composer', async () => {
    component.useSuggestion(component.topics[1].question);
    await fixture.whenStable();
    expect(send).toHaveBeenCalledWith(component.topics[1].question);
    expect(component.history().at(-1)?.text).toBe('Here is a little about Subhadra.');
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#chat-message'));
  });

  it('allows more than four exchanges', async () => {
    for (let index = 0; index < 5; index++) {
      component.message.set(`Question ${index}`);
      component.sendMessage();
      await fixture.whenStable();
    }
    expect(send).toHaveBeenCalledTimes(5);
    expect(component.history()).toHaveLength(10);
    component.message.set('A follow-up');
    expect(component.canSend()).toBe(true);
  });

  it('keeps drafts while thinking and prevents duplicate requests', async () => {
    let resolveReply!: (reply: string) => void;
    send.mockReturnValue(
      new Promise<string>((resolve) => {
        resolveReply = resolve;
      }),
    );
    component.useSuggestion('Hello');
    await fixture.whenStable();
    expect(component.loading()).toBe(true);
    expect(fixture.nativeElement.querySelector('.thinking-message')).not.toBeNull();
    component.message.set('Next question');
    component.sendMessage();
    expect(send).toHaveBeenCalledTimes(1);
    resolveReply('Hello there.');
    await fixture.whenStable();
    expect(component.loading()).toBe(false);
    expect(component.message()).toBe('Next question');
  });

  it('retries a failed reply without duplicating the visitor message', async () => {
    send.mockRejectedValueOnce(new Error('Network unavailable'));
    component.useSuggestion('Tell me about her work');
    await fixture.whenStable();
    expect(component.error()).not.toBe('');
    component.retryMessage();
    await fixture.whenStable();
    expect(send).toHaveBeenCalledTimes(2);
    expect(component.history().filter((item) => item.from === 'user')).toHaveLength(1);
    expect(component.error()).toBe('');
  });

  it('preserves the conversation and draft when motion changes', async () => {
    component.useSuggestion('Hello');
    await fixture.whenStable();
    const history = component.history();
    component.message.set('A thought');
    component.toggleMotion();
    component.reducedMotion.set(true);
    await fixture.whenStable();
    expect(component.motionEnabled()).toBe(false);
    expect(component.history()).toBe(history);
    expect(component.message()).toBe('A thought');
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('types the greeting, recedes, then reveals the same input without navigation', () => {
    fixture.destroy();
    vi.useFakeTimers();
    fixture = TestBed.createComponent(Chat);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const scene = fixture.nativeElement.querySelector('main');
    const input = fixture.nativeElement.querySelector('#chat-message') as HTMLInputElement;
    expect(component.introPhase()).toBe('arriving');
    expect(input.tabIndex).toBe(-1);
    expect(fixture.nativeElement.querySelector('.composer-reveal').hasAttribute('inert')).toBe(
      true,
    );
    vi.advanceTimersByTime(520);
    fixture.detectChanges();
    expect(component.introPhase()).toBe('typing');
    vi.advanceTimersByTime(850);
    fixture.detectChanges();
    expect(component.introTyped().length).toBeGreaterThan(0);
    expect(component.introTyped().length).toBeLessThan(component.introText.length);
    expect(component.composerReady()).toBe(false);
    vi.advanceTimersByTime(3000);
    fixture.detectChanges();
    expect(component.introPhase()).toBe('receding');
    expect(component.introTyped()).toBe(component.introText);
    vi.advanceTimersByTime(800);
    fixture.detectChanges();
    expect(component.composerReady()).toBe(true);
    expect(input.tabIndex).toBe(0);
    expect(fixture.nativeElement.querySelector('.composer-reveal').hasAttribute('inert')).toBe(
      false,
    );
    expect(fixture.nativeElement.querySelector('main')).toBe(scene);
    expect(fixture.nativeElement.querySelector('#chat-message')).toBe(input);
    expect(send).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('skips an in-progress introduction and cancels its pending callbacks', () => {
    fixture.destroy();
    vi.useFakeTimers();
    fixture = TestBed.createComponent(Chat);
    component = fixture.componentInstance;
    fixture.detectChanges();
    vi.advanceTimersByTime(800);
    component.skipIntro();
    fixture.detectChanges();
    expect(component.composerReady()).toBe(true);
    vi.advanceTimersByTime(5000);
    expect(component.introPhase()).toBe('ready');
    expect(component.introTyped()).toBe(component.introText);
    fixture.destroy();
  });

  it('finishes a partially typed reply when motion is paused and preserves the draft', async () => {
    vi.useFakeTimers();
    component.motionPaused.set(false);
    fixture.detectChanges();
    component.useSuggestion('Tell me more');
    await Promise.resolve();
    fixture.detectChanges();
    vi.advanceTimersByTime(240);
    fixture.detectChanges();
    expect(component.typingReplyId()).not.toBeNull();
    expect(component.replyVisibleText().length).toBeGreaterThan(0);
    expect(component.announcement()).toBe('');
    component.message.set('My next thought');
    component.sendMessage();
    expect(send).toHaveBeenCalledTimes(1);
    component.toggleMotion();
    fixture.detectChanges();
    expect(component.typingReplyId()).toBeNull();
    expect(component.replyVisibleText()).toBe('Here is a little about Subhadra.');
    expect(component.announcement()).toBe('Here is a little about Subhadra.');
    expect(component.message()).toBe('My next thought');
    expect(component.canSend()).toBe(true);
    fixture.destroy();
  });
});
