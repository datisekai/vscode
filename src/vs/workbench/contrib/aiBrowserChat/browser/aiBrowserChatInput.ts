/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from '../../../../base/common/uri.js';
import { EditorInputCapabilities } from '../../../common/editor.js';
import { EditorInput } from '../../../common/editor/editorInput.js';
import { AI_BROWSER_CHAT_ID } from '../common/aiBrowserChat.js';

export class AiBrowserChatInput extends EditorInput {
	static readonly ID = AI_BROWSER_CHAT_ID;

	override get typeId(): string {
		return AiBrowserChatInput.ID;
	}

	override get capabilities(): EditorInputCapabilities {
		return EditorInputCapabilities.Singleton;
	}

	override get editorId(): string {
		return AI_BROWSER_CHAT_ID;
	}

	override getName(): string {
		return 'AI Browser Chat';
	}

	override get resource(): URI {
		return URI.parse('aibrowserchat://main');
	}

	override matches(other: EditorInput): boolean {
		return other instanceof AiBrowserChatInput;
	}

	override dispose(): void {
		super.dispose();
	}
}


