# Poppy - Personal Assistant

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.7.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.



#Design/prompt 
Create a modern, responsive Chatbot UI component using Angular and Tailwind CSS.Core Tech Stack RequirementsFramework: Angular (latest stable version).Control Flow: Use Angular's modern built-in control flow block syntax (@if, @for, @empty) instead of structural directives (*ngIf, *ngFor).State Management: Use Angular Signals (signal(), computed(), effect()) to manage all component states, including message history, visibility, and loading states.Styling: Tailwind CSS for a sleek, modern, and clean design.Component Design & IdentityAssistant Name: "Assistant to the villain" (Display this prominently in the chat header).Persona / Vibe: Slightly mischievous, deeply efficient, and dark-humored (matching the "villain's assistant" theme).Visual Assets:Include a floating action button (FAB) with a chat icon (use a standard SVG or Lucide/Heroicons font icon) positioned in the bottom-right corner.Clicking the FAB toggles the main chat window open/closed.The chat window should feature a header with the assistant's name and a custom villainous avatar placeholder.Features & UI ElementsChat Window: Fixed positioning at the bottom right, scrolling container for messages, and an anchored input area at the bottom.Message Feed: Separate styling for user messages (right-aligned, distinct background color) and assistant messages (left-aligned, villainous theme colors like deep purples, slates, or dark greens).Input Handling: A text input area with an accompanying "Send" button. Pressing "Enter" or clicking "Send" should instantly update the Signals state.Mock Response System: Implement a temporary mock delay (using setTimeout) to simulate the assistant "thinking," during which a typing indicator is visible.Code Quality & StructureProvide a self-contained, clean Component file structure (.ts with inline template and styles or split cleanly).Ensure full type safety for message objects (e.g., id, sender: 'user' | 'assistant', text, timestamp).Make the UI highly responsive and accessible. "Assistant is typing..." State: When a user sends a message and isLoading is set to true, immediately display an animated "Assistant to the villain is typing..." placeholder at the bottom of the message feed.Use a modern Tailwind animation (like three bouncing dots using animate-bounce with staggered delays) to indicate the system is actively generating or waiting for the backend API response. Tailwind css and bootstrap already integrated. 