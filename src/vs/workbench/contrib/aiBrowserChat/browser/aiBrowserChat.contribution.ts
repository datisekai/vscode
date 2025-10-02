/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { registerAction2, Action2, MenuId } from '../../../../platform/actions/common/actions.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { EditorPaneDescriptor, IEditorPaneRegistry } from '../../../browser/editor.js';
import { EditorExtensions } from '../../../common/editor.js';
import { AiBrowserChatEditor } from './aiBrowserChatEditor.js';
import { AiBrowserChatInput } from './aiBrowserChatInput.js';
import { AI_BROWSER_CHAT_ID } from '../common/aiBrowserChat.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { localize } from '../../../../nls.js';
import './media/aiBrowserChat.css';
import { Extensions as ConfigurationExtensions, IConfigurationRegistry } from '../../../../platform/configuration/common/configurationRegistry.js';
import { registerWorkbenchContribution2, WorkbenchPhase } from '../../../common/contributions.js';
import { Disposable } from '../../../../base/common/lifecycle.js';

// Register Editor Pane
Registry.as<IEditorPaneRegistry>(EditorExtensions.EditorPane)
	.registerEditorPane(
		EditorPaneDescriptor.create(
			AiBrowserChatEditor,
			AI_BROWSER_CHAT_ID,
			localize('aiBrowserChat', "AI Browser Chat")
		),
		[
			new SyncDescriptor(AiBrowserChatInput)
		]
	);

// Register Configuration
const configurationRegistry = Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration);
configurationRegistry.registerConfiguration({
	id: 'aiBrowserChat',
	title: localize('aiBrowserChatConfigurationTitle', "AI Browser Chat"),
	type: 'object',
	properties: {
		'aiBrowserChat.googleApiKey': {
			type: 'string',
			default: 'AIzaSyCkh9JXTrxVFYWjUI2ZRlxvpST85si3-v8',
			description: localize('aiBrowserChat.googleApiKey', "Google AI API Key for Gemini"),
			scope: 3 // ConfigurationScope.WINDOW
		}
	}
});

// Register Command to Open AI Browser Chat
class OpenAiBrowserChatAction extends Action2 {
	constructor() {
		super({
			id: 'workbench.action.openAiBrowserChat',
			title: {
				value: localize('openAiBrowserChat', "Open AI Browser Chat"),
				original: 'Open AI Browser Chat'
			},
			category: {
				value: localize('aiBrowserChatCategory', "View"),
				original: 'View'
			},
			f1: true,
			menu: {
				id: MenuId.CommandPalette
			}
		});
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		const editorService = accessor.get(IEditorService);
		const input = new AiBrowserChatInput();
		await editorService.openEditor(input, { pinned: true });
	}
}

registerAction2(OpenAiBrowserChatAction);

// Auto-open AI Browser Chat on startup
class AiBrowserChatStartupContribution extends Disposable {
	constructor(
		@IEditorService private readonly editorService: IEditorService
	) {
		super();
		this.openAiBrowserChat();
	}

	private async openAiBrowserChat(): Promise<void> {
		// Wait a bit to let the workbench initialize
		setTimeout(() => {
			const input = new AiBrowserChatInput();
			this.editorService.openEditor(input, { pinned: true });
		}, 100);
	}
}

registerWorkbenchContribution2('workbench.contrib.aiBrowserChatStartup', AiBrowserChatStartupContribution, WorkbenchPhase.AfterRestored);

