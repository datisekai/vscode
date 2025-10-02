# AI Browser Chat - Tính năng mới cho VSCode

## Mô tả

Tính năng AI Browser Chat cho phép bạn:

- Duyệt web trực tiếp trong VSCode với embedded browser (80% màn hình bên trái)
- Chat với AI về nội dung website (20% màn hình bên phải)
- Sử dụng Google Gemini AI để trả lời câu hỏi về website

## Cấu trúc code

```
src/vs/workbench/contrib/aiBrowserChat/
├── browser/
│   ├── aiBrowserChatEditor.ts       # EditorPane chính - render UI
│   ├── aiBrowserChatInput.ts        # EditorInput - đại diện cho editor
│   ├── aiBrowserChat.contribution.ts # Đăng ký contribution, actions, config
│   └── media/
│       └── aiBrowserChat.css        # CSS styling cho UI
└── common/
    └── aiBrowserChat.ts             # Constants và interfaces
```

## Cài đặt và sử dụng

### 1. Cấu hình Google AI API Key

Trước khi sử dụng, bạn cần:

1. Lấy Google AI API Key từ: https://aistudio.google.com/app/apikey
2. Mở VSCode Settings (Cmd+,)
3. Tìm kiếm "AI Browser Chat"
4. Nhập API Key vào trường `aiBrowserChat.googleApiKey`

Hoặc thêm vào `settings.json`:

```json
{
	"aiBrowserChat.googleApiKey": "YOUR_API_KEY_HERE"
}
```

### 2. Build và chạy

```bash
# Compile code
npm run compile

# Chạy VSCode
./scripts/code.sh

# Hoặc trên macOS
./scripts/code.sh --disable-extensions
```

### 3. Mở AI Browser Chat

Sau khi VSCode khởi động:

- Tính năng sẽ **tự động mở** ngay khi VSCode khởi động
- Hoặc sử dụng Command Palette (Cmd+Shift+P): `Open AI Browser Chat`

## Cách sử dụng

1. **Load website**:

   - Nhập URL vào ô input ở phía trên browser panel
   - Click nút "Load" hoặc nhấn Enter

2. **Chat với AI**:
   - Nhập câu hỏi vào chatbox bên phải
   - AI sẽ phân tích nội dung website và trả lời
   - Ví dụ:
     - "Tóm tắt nội dung trang này"
     - "Chủ đề chính là gì?"
     - "Trích xuất thông tin quan trọng"

## Tính năng

- ✅ Embedded browser với iframe (80% width)
- ✅ Chatbox với AI assistant (20% width)
- ✅ Tích hợp Google Gemini 2.0 Flash
- ✅ UI responsive với VSCode theme
- ✅ Tự động mở khi khởi động VSCode
- ✅ Command để mở thủ công
- ✅ Cấu hình API key trong Settings

## Lưu ý

- **Cross-Origin**: Một số website có CORS policy nghiêm ngặt, iframe có thể không load được
- **API Key**: Cần có Google AI API key để sử dụng tính năng chat
- **Content Reading**: Do security restrictions, một số website không cho phép đọc nội dung từ iframe

## Troubleshooting

### Website không load trong iframe

- Một số website chặn việc nhúng trong iframe (X-Frame-Options)
- Thử với website khác như Wikipedia, GitHub, etc.

### AI không trả lời

- Kiểm tra API key đã được cấu hình đúng chưa
- Kiểm tra console logs để xem lỗi API

### Build errors

```bash
# Clean và build lại
npm run clean
npm run compile
```

## Technical Details

### Architecture

- **EditorPane**: Tạo DOM structure với flexbox layout
- **EditorInput**: Singleton input đại diện cho editor
- **Workbench Contribution**: Tự động đăng ký và khởi động
- **Google AI API**: Direct REST API call đến Gemini

### API Usage

```typescript
// Format của API request
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent
{
  "contents": [{
    "parts": [{
      "text": "Prompt with website content + question"
    }]
  }]
}
```

## Future Improvements

- [ ] Thêm support cho nhiều AI providers (OpenAI, Claude, etc.)
- [ ] History chat persistence
- [ ] Better website content extraction
- [ ] Screenshot/capture website
- [ ] Export conversation
- [ ] Multiple browser tabs
