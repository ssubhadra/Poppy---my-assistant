import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);

  async sendMessageToAssistant(message: string): Promise<string> {
    const response = await firstValueFrom(
      this.http.post<{ reply: string }>(`${environment.apiUrl}/chat`, { message }),
    );
    return response.reply;
  }
}
