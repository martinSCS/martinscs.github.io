class ApiHandler {
    constructor() {
        this.apiKey = localStorage.getItem('geminiApiKey') || '';
        this.apiModal = document.getElementById('apiModal');
        this.apiKeyInput = document.getElementById('apiKey');
        this.saveApiKeyButton = document.getElementById('saveApiKey');
        this.settingsBtn = document.getElementById('settingsBtn');

        this.init();
    }

    init() {
        // 如果没有保存的API key，显示模态框
        if (!this.apiKey) {
            this.showApiModal();
        }

        // 设置按钮事件监听
        this.saveApiKeyButton.addEventListener('click', () => this.saveApiKey());
        this.settingsBtn.addEventListener('click', () => this.showApiModal());

        // 如果有保存的API key，填入输入框
        if (this.apiKey) {
            this.apiKeyInput.value = this.apiKey;
        }
    }

    showApiModal() {
        this.apiModal.classList.add('show');
    }

    hideApiModal() {
        this.apiModal.classList.remove('show');
    }

    saveApiKey() {
        const key = this.apiKeyInput.value.trim();
        if (key) {
            this.apiKey = key;
            localStorage.setItem('geminiApiKey', key);
            this.hideApiModal();
        } else {
            alert('请输入有效的 Gemini API Key!');
        }
    }

    async sendRequest(requestData) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: JSON.stringify(requestData)
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.2,
                        topP: 0.8,
                        topK: 40
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API 请求失败: ${response.status} ${response.statusText} - ${errorData.error?.message || '未知错误'}`);
            }

            const data = await response.json();

            // 提取响应文本
            if (data.candidates && data.candidates.length > 0 &&
                data.candidates[0].content &&
                data.candidates[0].content.parts &&
                data.candidates[0].content.parts.length > 0) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('未能从 Gemini 获取有效的文本响应');
            }
        } catch (error) {
            console.error('API 请求出错:', error);
            throw error;
        }
    }

    hasApiKey() {
        return !!this.apiKey;
    }
}
