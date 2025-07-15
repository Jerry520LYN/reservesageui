<template>
  <el-container class="ai-energy-assistant">
    <!-- 左侧历史会话 -->
    <el-aside width="280px" class="history-sidebar">
      <div class="sidebar-header">
        <h2>智慧储能管家</h2>
        <el-button type="primary" plain @click="createNewChat">
          <el-icon><Plus /></el-icon> 新建对话
        </el-button>
      </div>
      <div class="history-list">
        <div
          v-for="item in chatHistory"
          :key="item.id"
          :class="['history-item', { active: currentChatId === item.id }]"
          @click="switchChat(item.id)"
        >
          <el-icon><ChatDotRound /></el-icon>
          <span class="history-title">{{ item.title }}</span>
          <span class="history-date">{{ formatDate(item.createdAt) }}</span>
        </div>
      </div>
    </el-aside>

    <!-- 右侧对话区域 -->
    <el-container class="chat-container">
      <!-- 对话顶部 -->
      <el-header class="chat-header">
        <div class="current-chat-info">
          <h3>{{ currentChatTitle }}</h3>
        </div>
        <div class="header-actions">
          <el-button type="primary" plain size="small" @click="clearMessages">
            <el-icon><Delete /></el-icon> 清空对话
          </el-button>
        </div>
      </el-header>

      <!-- 对话内容区 -->
      <el-main class="chat-main" ref="chatContainerRef">
        <div class="welcome-container" v-if="currentMessages.length === 0">
          <img src="https://img.icons8.com/color/96/000000/energy.png" alt="能源图标" class="welcome-icon">
          <h2>智慧储能管家</h2>
          <p>您的专属能源存储与优化专家</p>
          <div class="suggestion-chips">
            <el-tag @click="sendSuggestion('储能系统健康状态分析')" class="suggestion-chip">储能系统健康状态分析</el-tag>
            <el-tag @click="sendSuggestion('最佳充放电策略推荐')" class="suggestion-chip">最佳充放电策略推荐</el-tag>
            <el-tag @click="sendSuggestion('储能经济效益分析')" class="suggestion-chip">储能经济效益分析</el-tag>
            <el-tag @click="sendSuggestion('电池寿命预测')" class="suggestion-chip">电池寿命预测</el-tag>
          </div>
        </div>

        <div v-else class="messages-container">
          <div
            v-for="(message, index) in currentMessages"
            :key="index"
            :class="['message', message.role === 'assistant' ? 'ai-message' : 'user-message']"
          >
            <div class="message-avatar">
              <el-avatar 
                :icon="message.role === 'assistant' ? 'ElIconService' : 'ElIconUser'"
                :class="message.role === 'assistant' ? 'ai-avatar' : 'user-avatar'"
              />
            </div>
            <div class="message-content">
              <div class="message-header">
                <span class="sender-name">{{ message.role === 'assistant' ? '智慧储能管家' : '您' }}</span>
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              </div>
              
              <!-- 文件附件 -->
              <div v-if="message.files && message.files.length > 0" class="file-attachments">
                <div v-for="(file, fileIndex) in message.files" :key="fileIndex" class="file-item">
                  <el-icon><Document /></el-icon>
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">({{ formatFileSize(file.size) }})</span>
                </div>
              </div>
              
              <!-- 文本内容 -->
              <div class="message-text" v-html="formatMessage(message.content)"></div>
              
              <!-- AI消息的额外操作 -->
              <div v-if="message.role === 'assistant'" class="message-actions">
                <el-button type="text" size="small" @click="copyContent(message.content)">
                  <el-icon><CopyDocument /></el-icon> 复制
                </el-button>
              </div>
            </div>
          </div>
          
          <!-- 流式输入提示 -->
          <div v-if="isAiTyping" class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </el-main>

      <!-- 输入区域 -->
      <el-footer class="chat-footer" height="auto">
        <div class="input-container">
          <el-upload
            class="file-upload"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleFileChange"
            multiple
          >
            <el-button type="text">
              <el-icon><Paperclip /></el-icon>
            </el-button>
          </el-upload>

          <div class="selected-files" v-if="selectedFiles.length > 0">
            <el-tag 
              v-for="(file, index) in selectedFiles" 
              :key="index" 
              closable 
              @close="removeFile(index)"
              class="file-tag"
            >
              {{ file.name }}
            </el-tag>
          </div>

          <el-input
            v-model="userInput"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 4 }"
            placeholder="请输入您的问题，支持上传文件..."
            @keydown.enter.exact.prevent="sendMessage"
          />
          <el-button
            type="primary"
            :disabled="!userInput.trim() && selectedFiles.length === 0"
            @click="sendMessage"
          >
            <el-icon><Position /></el-icon>
          </el-button>
        </div>
      </el-footer>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { 
  Plus, ChatDotRound, Delete, Document, 
  CopyDocument, Paperclip, Position
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { getHistoryChats, getChatMessages, sendUserMessage } from './mockApi.js';

// 数据
const chatHistory = ref([]);
const currentChatId = ref(null);
const messagesMap = ref({}); // 存储每个会话的消息列表
const userInput = ref('');
const selectedFiles = ref([]);
const isAiTyping = ref(false);
const chatContainerRef = ref(null);

// 计算属性
const currentMessages = computed(() => {
  return currentChatId.value && messagesMap.value[currentChatId.value]
    ? messagesMap.value[currentChatId.value]
    : [];
});

const currentChatTitle = computed(() => {
  const current = chatHistory.value.find(chat => chat.id === currentChatId.value);
  return current ? current.title : '新对话';
});

// 方法
const loadChatHistory = async () => {
  try {
    const result = await getHistoryChats();
    chatHistory.value = result;
    
    if (result.length > 0) {
      await switchChat(result[0].id);
    } else {
      await createNewChat();
    }
  } catch (error) {
    console.error('Failed to load chat history:', error);
    ElMessage.error('加载历史对话失败');
  }
};

const switchChat = async (chatId) => {
  currentChatId.value = chatId;
  
  if (!messagesMap.value[chatId]) {
    try {
      const messages = await getChatMessages(chatId);
      messagesMap.value[chatId] = messages;
    } catch (error) {
      console.error('Failed to load chat messages:', error);
      ElMessage.error('加载对话消息失败');
      messagesMap.value[chatId] = [];
    }
  }
  
  await nextTick();
  scrollToBottom();
};

const createNewChat = async () => {
  const newChatId = 'chat_' + Date.now();
  const newChat = {
    id: newChatId,
    title: '新对话',
    createdAt: new Date().toISOString()
  };
  
  chatHistory.value.unshift(newChat);
  messagesMap.value[newChatId] = [];
  await switchChat(newChatId);
};

const sendMessage = async () => {
  if (!userInput.value.trim() && selectedFiles.length === 0) return;
  
  const userMessage = {
    role: 'user',
    content: userInput.value.trim(),
    timestamp: new Date().toISOString(),
    files: [...selectedFiles.value]
  };
  
  // 清空输入
  userInput.value = '';
  selectedFiles.value = [];
  
  // 添加用户消息
  if (!messagesMap.value[currentChatId.value]) {
    messagesMap.value[currentChatId.value] = [];
  }
  
  messagesMap.value[currentChatId.value].push(userMessage);
  
  // 更新当前会话标题（如果是第一条消息）
  if (messagesMap.value[currentChatId.value].length === 1 && userMessage.content) {
    const currentChat = chatHistory.value.find(chat => chat.id === currentChatId.value);
    if (currentChat) {
      currentChat.title = userMessage.content.substring(0, 18) + (userMessage.content.length > 18 ? '...' : '');
    }
  }
  
  await nextTick();
  scrollToBottom();
  
  // 模拟AI回复
  isAiTyping.value = true;
  
  try {
    const response = await sendUserMessage({
      chatId: currentChatId.value,
      content: userMessage.content,
      files: userMessage.files
    });
    
    isAiTyping.value = false;
    
    if (response) {
      messagesMap.value[currentChatId.value].push({
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString()
      });
      
      await nextTick();
      scrollToBottom();
    }
  } catch (error) {
    isAiTyping.value = false;
    console.error('Failed to get AI response:', error);
    ElMessage.error('获取AI回复失败');
  }
};

const sendSuggestion = (suggestion) => {
  userInput.value = suggestion;
  sendMessage();
};

const handleFileChange = (file) => {
  selectedFiles.value.push({
    name: file.name,
    size: file.size,
    type: file.type,
    url: URL.createObjectURL(file.raw)
  });
};

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1);
};

const clearMessages = () => {
  if (currentChatId.value) {
    messagesMap.value[currentChatId.value] = [];
  }
};

const copyContent = (content) => {
  navigator.clipboard.writeText(content)
    .then(() => {
      ElMessage.success('已复制到剪贴板');
    })
    .catch(() => {
      ElMessage.error('复制失败');
    });
};

const scrollToBottom = () => {
  if (chatContainerRef.value) {
    chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight;
  }
};

// 格式化工具函数
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const formatFileSize = (size) => {
  if (size < 1024) {
    return `${size}B`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)}KB`;
  } else {
    return `${(size / (1024 * 1024)).toFixed(1)}MB`;
  }
};

const formatMessage = (message) => {
  if (!message) return '';
  
  // 替换链接
  let formattedMessage = message.replace(
    /(https?:\/\/[^\s]+)/g, 
    '<a href="$1" target="_blank">$1</a>'
  );
  
  // 替换换行符
  formattedMessage = formattedMessage.replace(/\n/g, '<br>');
  
  return formattedMessage;
};

// 生命周期钩子
onMounted(() => {
  loadChatHistory();
});

// 监听切换对话，滚动到底部
watch(currentChatId, async () => {
  await nextTick();
  scrollToBottom();
});
</script>

<style scoped>
.ai-energy-assistant {
  height: 100vh;
  background-color: #f5f7fa;
  color: #333;
}

/* 侧边栏样式 */
.history-sidebar {
  background-color: #fff;
  border-right: 1px solid #e6e6e6;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.3s;
}

.sidebar-header {
  padding: 20px 16px;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #0078d4;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.history-item {
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  border-radius: 6px;
  margin: 4px 8px;
  position: relative;
  overflow: hidden;
}

.history-item:hover {
  background-color: #f5f7fa;
}

.history-item.active {
  background-color: #e6f7ff;
}

.history-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
}

.history-date {
  font-size: 12px;
  color: #909399;
}

/* 对话容器样式 */
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
}

.current-chat-info h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.chat-main {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f5f7fa;
}

/* 欢迎页面样式 */
.welcome-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 0 20px;
}

.welcome-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 16px;
}

.welcome-container h2 {
  margin: 0 0 10px 0;
  font-size: 28px;
  color: #0078d4;
}

.welcome-container p {
  margin: 0 0 24px 0;
  font-size: 16px;
  color: #666;
}

.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.suggestion-chip {
  cursor: pointer;
  padding: 10px 16px;
  border-radius: 20px;
  transition: all 0.2s;
}

.suggestion-chip:hover {
  background-color: #0078d4;
  color: white;
}

/* 消息样式 */
.messages-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message {
  display: flex;
  gap: 16px;
  max-width: 92%;
}

.user-message {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.ai-message {
  align-self: flex-start;
}

.message-avatar {
  flex-shrink: 0;
}

.user-avatar {
  background-color: #0078d4;
}

.ai-avatar {
  background-color: #2db7f5;
}

.message-content {
  background-color: #fff;
  border-radius: 8px;
  padding: 12px 16px;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  flex: 1;
  max-width: calc(100% - 56px);
}

.user-message .message-content {
  background-color: #e6f7ff;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 14px;
}

.sender-name {
  font-weight: 600;
  color: #0078d4;
}

.user-message .sender-name {
  color: #1890ff;
}

.message-time {
  font-size: 12px;
  color: #909399;
}

.message-text {
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.message-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}

/* 文件样式 */
.file-attachments {
  margin-bottom: 10px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 6px;
}

.file-name {
  font-weight: 500;
}

.file-size {
  font-size: 12px;
  color: #909399;
}

/* 输入区域样式 */
.chat-footer {
  background-color: #fff;
  border-top: 1px solid #e6e6e6;
  padding: 12px 20px;
}

.input-container {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}

.file-upload {
  margin-right: 5px;
}

.selected-files {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 10px;
  max-width: calc(100% - 80px);
}

.file-tag {
  max-width: 200px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.input-container :deep(.el-textarea__inner) {
  padding-right: 50px;
  resize: none;
  border-radius: 8px;
  min-height: 40px;
  max-height: 120px;
  font-size: 14px;
}

.input-container .el-button {
  position: absolute;
  right: 10px;
  bottom: 8px;
  padding: 8px;
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
}

/* 打字指示器 */
.typing-indicator {
  display: inline-flex;
  align-items: center;
  padding: 10px 12px;
  background: #f2f2f2;
  border-radius: 18px;
  margin-bottom: 10px;
}

.typing-indicator span {
  height: 8px;
  width: 8px;
  background: #0078d4;
  border-radius: 50%;
  display: inline-block;
  margin: 0 2px;
  animation: typing 1.5s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-5px);
  }
}
</style>