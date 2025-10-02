/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as dom from '../../../../base/browser/dom.js';
import { CancellationToken } from '../../../../base/common/cancellation.js';
import { DisposableStore } from '../../../../base/common/lifecycle.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IEditorOptions } from '../../../../platform/editor/common/editor.js';
import { IStorageService } from '../../../../platform/storage/common/storage.js';
import { ITelemetryService } from '../../../../platform/telemetry/common/telemetry.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { EditorPane } from '../../../browser/parts/editor/editorPane.js';
import { IEditorOpenContext } from '../../../common/editor.js';
import { IEditorGroup } from '../../../services/editor/common/editorGroupsService.js';
import { AI_BROWSER_CHAT_ID } from '../common/aiBrowserChat.js';
import { AiBrowserChatInput } from './aiBrowserChatInput.js';

interface Message {
	type: 'user' | 'ai';
	text: string;
}

export class AiBrowserChatEditor extends EditorPane {
	static readonly ID = AI_BROWSER_CHAT_ID;

	private container!: HTMLElement;
	private browserPanel!: HTMLElement;
	private chatPanel!: HTMLElement;
	private urlInput!: HTMLInputElement;
	private iframe!: HTMLIFrameElement;
	private chatMessages!: HTMLElement;
	private chatInput!: HTMLInputElement;
	private messages: Message[] = [];
	private isLoading = false;
	private currentWebsiteContent: string = '';

	private readonly disposables = new DisposableStore();

	constructor(
		group: IEditorGroup,
		@ITelemetryService telemetryService: ITelemetryService,
		@IThemeService themeService: IThemeService,
		@IStorageService storageService: IStorageService,
		@IConfigurationService private readonly configurationService: IConfigurationService,
	) {
		super(AI_BROWSER_CHAT_ID, group, telemetryService, themeService, storageService);
	}

	protected override createEditor(parent: HTMLElement): void {
		this.container = dom.append(parent, dom.$('.ai-browser-chat-container'));

		// Create browser panel (left 80%)
		this.browserPanel = dom.append(this.container, dom.$('.browser-panel'));
		const browserToolbar = dom.append(this.browserPanel, dom.$('.browser-toolbar'));

		this.urlInput = dom.append(browserToolbar, dom.$('input.url-input')) as HTMLInputElement;
		this.urlInput.type = 'text';
		this.urlInput.placeholder = 'Enter website URL...';
		this.urlInput.value = 'https://sisu.co/';

		const loadButton = dom.append(browserToolbar, dom.$('button.load-button'));
		loadButton.textContent = 'Load';
		loadButton.onclick = () => this.loadUrl();

		this.urlInput.onkeypress = (e) => {
			if (e.key === 'Enter') {
				this.loadUrl();
			}
		};

		const browserContent = dom.append(this.browserPanel, dom.$('.browser-content'));
		this.iframe = dom.append(browserContent, dom.$('iframe.website-iframe')) as HTMLIFrameElement;
		this.iframe.src = 'https://sisu.co/';
		this.iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms');

		// Create chat panel (right 20%)
		this.chatPanel = dom.append(this.container, dom.$('.chat-panel'));

		const chatHeader = dom.append(this.chatPanel, dom.$('.chat-header'));
		const chatTitle = dom.append(chatHeader, dom.$('h3'));
		chatTitle.textContent = 'AI Assistant';
		const chatSubtitle = dom.append(chatHeader, dom.$('p.chat-subtitle'));
		chatSubtitle.textContent = 'Ask questions about the website';

		this.chatMessages = dom.append(this.chatPanel, dom.$('.chat-messages'));
		this.renderEmptyState();

		const chatInputContainer = dom.append(this.chatPanel, dom.$('.chat-input-container'));
		this.chatInput = dom.append(chatInputContainer, dom.$('input.chat-input')) as HTMLInputElement;
		this.chatInput.type = 'text';
		this.chatInput.placeholder = 'Ask a question...';
		this.chatInput.onkeypress = (e) => {
			if (e.key === 'Enter' && !this.isLoading) {
				this.sendQuestion();
			}
		};

		const sendButton = dom.append(chatInputContainer, dom.$('button.send-button'));
		sendButton.textContent = 'Send';
		sendButton.onclick = () => this.sendQuestion();

		// Auto-load initial URL
		this.loadUrl();
	}

	private renderEmptyState(): void {
		dom.clearNode(this.chatMessages);
		const emptyState = dom.append(this.chatMessages, dom.$('.empty-state'));

		const welcomeText = dom.append(emptyState, dom.$('p'));
		welcomeText.textContent = 'Welcome! Load a website and ask me anything about it.';

		const hintTitle = dom.append(emptyState, dom.$('p.hint'));
		hintTitle.textContent = 'Examples:';

		const hintList = dom.append(emptyState, dom.$('ul'));
		const hints = ['Summarize this page', 'What are the main topics?', 'Extract key information'];
		hints.forEach(hint => {
			const li = dom.append(hintList, dom.$('li'));
			li.textContent = hint;
		});
	}

	private async loadUrl(): Promise<void> {
		const url = this.urlInput.value.trim();
		if (!url) {
			return;
		}

		// Load in iframe for visual display
		this.iframe.src = url;

		// Fetch content for AI processing
		try {
			console.log('Fetching website content from:', url);
			const response = await fetch(`https://proxy.finn777.site/api/proxy?url=${url}`, {
				mode: 'cors',
				headers: {
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				}
			});

			if (response.ok) {
				const html = await response.text();
				// Extract text content from HTML
				const parser = new DOMParser();
				const doc = parser.parseFromString(html, 'text/html');
				this.currentWebsiteContent = doc.body.innerText || doc.body.textContent || '';
				console.log('Website content loaded:', this.currentWebsiteContent.length, 'characters');
			} else {
				console.warn('Failed to fetch website content:', response.status);
				this.currentWebsiteContent = `Unable to fetch website content (HTTP ${response.status}). You can still ask general questions.`;
			}
		} catch (error) {
			console.warn('CORS or network error:', error);
			this.currentWebsiteContent = 'Unable to fetch website content due to CORS restrictions. The website will still display in the iframe, but AI analysis may be limited. Try websites that allow CORS like Wikipedia or GitHub.';
		}
	}

	private async sendQuestion(): Promise<void> {
		const question = this.chatInput.value.trim();
		if (!question || this.isLoading) {
			return;
		}

		// Add user message
		this.messages.push({ type: 'user', text: question });
		this.renderMessages();
		this.chatInput.value = '';
		this.isLoading = true;

		// Show loading
		this.showLoading();

		try {
			// Get API key from configuration
			const apiKey = this.configurationService.getValue<string>('aiBrowserChat.googleApiKey');
			if (!apiKey) {
				throw new Error('Please set your Google AI API key in settings (aiBrowserChat.googleApiKey)');
			}

			// Use cached website content
			const websiteContent = this.currentWebsiteContent || 'No website content loaded yet. Please load a website first.';

			// Call Google AI API
			const response = await this.callGoogleAI(question, websiteContent, apiKey);

			// Add AI response
			this.messages.push({ type: 'ai', text: response });
			this.renderMessages();
		} catch (error) {
			// Add error message
			this.messages.push({ type: 'ai', text: `Error: ${error instanceof Error ? error.message : String(error)}` });
			this.renderMessages();
		} finally {
			this.isLoading = false;
		}
	}

	private async callGoogleAI(question: string, websiteContent: string, apiKey: string): Promise<string> {
		console.log('Question:', question);
		console.log('Content length:', websiteContent.length, 'chars');

		const prompt = `You are an intelligent AI assistant specializing in website content analysis. Your task is to answer questions based on the provided website content accurately and professionally.

IMPORTANT INSTRUCTIONS:
1. **Language**: Always respond in the SAME LANGUAGE as the user's question. If they ask in Vietnamese, answer in Vietnamese. If they ask in English, answer in English.
2. **Accuracy**: Base your answer ONLY on the provided website content. Do not add information from outside sources.
3. **Relevance**: Focus specifically on what the user is asking. Be concise but thorough.
4. **Format**: Use clear, well-structured responses with bullet points or paragraphs as appropriate.
5. **Honesty**: If the content doesn't contain enough information to answer the question, clearly state that.

---

WEBSITE CONTENT:
${websiteContent.substring(0, 15000)}${websiteContent.length > 15000 ? '\n\n[Note: Content truncated due to length. This is a partial excerpt of the full page.]' : ''}

---

USER QUESTION:
${question}

---

YOUR ANSWER (in the same language as the question):`;

		const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				contents: [{
					parts: [{
						text: prompt
					}]
				}],
				generationConfig: {
					temperature: 0.7,
					maxOutputTokens: 2048,
					topP: 0.8,
					topK: 40
				}
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`API Error: ${response.status} - ${errorText}`);
		}

		const data = await response.json();
		return data.candidates[0]?.content?.parts[0]?.text || 'No response from AI';
	}

	private showLoading(): void {
		const loadingMsg = dom.append(this.chatMessages, dom.$('.message.ai-message'));
		const loadingContent = dom.append(loadingMsg, dom.$('.message-content.loading'));
		loadingContent.textContent = '... Thinking...';
		this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
	}

	private renderMessages(): void {
		dom.clearNode(this.chatMessages);

		if (this.messages.length === 0) {
			this.renderEmptyState();
			return;
		}

		this.messages.forEach(msg => {
			const messageDiv = dom.append(this.chatMessages, dom.$(`.message.${msg.type}-message`));
			const contentDiv = dom.append(messageDiv, dom.$('.message-content'));
			contentDiv.textContent = msg.text;
		});

		// Scroll to bottom
		this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
	}

	override async setInput(input: AiBrowserChatInput, options: IEditorOptions | undefined, context: IEditorOpenContext, token: CancellationToken): Promise<void> {
		await super.setInput(input, options, context, token);
	}

	override clearInput(): void {
		super.clearInput();
	}

	override focus(): void {
		super.focus();
		this.chatInput?.focus();
	}

	override layout(dimension: dom.Dimension): void {
		// Layout is handled by CSS flexbox
	}

	override dispose(): void {
		this.disposables.dispose();
		super.dispose();
	}
}
