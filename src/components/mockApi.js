// mockApi.js
import Mock from 'mockjs';

// 随机生成聊天历史记录
const generateChatHistory = () => {
  const history = [];
  const count = Mock.Random.integer(3, 8);
  
  for (let i = 0; i < count; i++) {
    const id = `chat_${Mock.Random.guid()}`;
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    history.push({
      id,
      title: i === 0 ? '当前储能系统运行状态' :
             i === 1 ? '光储充放电策略优化' :
             Mock.Random.csentence(5, 15),
      createdAt: date.toISOString(),
      messageCount: Mock.Random.integer(5, 30)
    });
  }
  
  return history;
};

// 生成储能相关回复
const generateEnergyResponse = (query) => {
  // 储能系统关键词匹配
  const keywords = {
    '储能系统': [
      '您的储能系统目前运行良好，充放电效率保持在95%以上。',
      '根据数据分析，您的储能系统有一些性能优化空间，建议查看详细报告。',
      '电池组健康度评估显示所有模块均在健康范围内，预计剩余寿命超过8年。'
    ],
    '充放电': [
      '基于您当前的用电模式和电价政策，我建议在谷电时段（23:00-7:00）进行充电，在峰电时段（12:00-15:00和18:00-21:00）进行放电，这样可以最大化经济收益。',
      '根据过去7天的数据，您的充放电策略已经帮您节省了约312元电费。',
      '当前充电深度控制在20%-80%之间，这有利于延长电池寿命。'
    ],
    '电池': [
      '您的电池组容量衰减率为每年3.2%，低于行业平均水平的4.5%，表现良好。',
      '监测到3号电池模块温度略高，但仍在安全范围内，建议关注其变化趋势。',
      '电池管理系统已自动平衡了各模块电压，确保整体性能最优。'
    ],
    '经济效益': [
      '根据测算，您的储能系统ROI周期约为4.2年，优于行业平均的5.5年。',
      '过去一个月，储能系统为您创造的经济效益约1450元，其中峰谷价差收益占85%，需求侧响应收益占15%。',
      '如果参与电网辅助服务，您每年可增加约8000-12000元的额外收益。'
    ],
    '优化': [
      '建议增加400kWh容量以匹配您的用电负荷特性，投资回报周期预计为3.8年。',
      '对充放电策略进行优化后，预计可提升经济效益15-20%。',
      '结合光伏发电，可构建"光储一体化"解决方案，进一步提升可再生能源利用率和经济效益。'
    ]
  };
  
  // 默认回复
  const defaultResponses = [
    '根据能源管理系统的数据分析，您的储能设备运行状态良好，当前SOC为78%。今日已完成3个完整充放电循环，系统效率保持在96.2%，高于行业平均水平。',
    '基于历史用电数据和电价政策，我为您制定了最优充放电策略，预计可节省电费支出约15%。建议在低谷电价时段（23:00-7:00）充电，高峰时段（18:00-21:00）放电，以最大化经济效益。',
    '您的储能电池组健康状况评分为92分（满分100分），预计剩余使用寿命为8.5年。建议继续维持现有的充放电深度控制，避免频繁的深度放电，可有效延长电池使用寿命。',
    '已为您分析完成本月储能经济效益报告。通过峰谷电价差套利，本月节省电费1245元；通过参与需求响应项目，额外获得补贴680元。投资回报率保持良好，预计全投资回收期为4.2年。'
  ];
  
  // 判断输入是否包含关键词
  for (const [key, responses] of Object.entries(keywords)) {
    if (query.includes(key)) {
      return Mock.Random.pick(responses);
    }
  }
  
  // 如果有上传文件，返回文件分析结果
  if (query.includes('文件') || query.includes('file')) {
    return '我已接收并分析了您上传的储能系统数据文件。根据文件内容，系统运行参数正常，但存在充电效率波动的情况。建议检查充电设备是否存在故障或老化现象。详细分析报告已生成，您可以在"系统分析"页面查看完整报告。';
  }
  
  // 返回默认回复
  return Mock.Random.pick(defaultResponses);
};

// 生成聊天消息
const generateMessages = () => {
  const count = Mock.Random.integer(0, 12);
  const messages = [];
  
  if (count === 0) return messages;
  
  // 模拟在过去几小时内的对话
  let baseTime = new Date();
  baseTime.setHours(baseTime.getHours() - 2);
  
  for (let i = 0; i < count; i++) {
    const isUser = i % 2 === 0;
    const timeOffset = Mock.Random.integer(1, 10) * (i + 1);
    const timestamp = new Date(baseTime.getTime() + timeOffset * 60000).toISOString();
    
    let content = '';
    if (isUser) {
      content = Mock.Random.pick([
        '我的储能系统现在运行状态如何？',
        '能帮我检查下储能设备的健康状况吗？',
        '请推荐一个最优的充放电策略',
        '储能系统的经济效益分析',
        '如何优化我的储能配置？',
        '电池健康度评估',
        '帮我评估一下储能系统的ROI'
      ]);
    } else {
      content = generateEnergyResponse(messages[i-1].content);
    }
    
    messages.push({
      role: isUser ? 'user' : 'assistant',
      content,
      timestamp,
      files: isUser && Mock.Random.boolean(0.2) ? [{
        name: Mock.Random.pick(['储能系统数据.xlsx', '电池健康报告.pdf', '用电负荷曲线.csv']),
        size: Mock.Random.integer(50, 5000) * 1024,
        type: Mock.Random.pick(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf', 'text/csv'])
      }] : []
    });
  }
  
  return messages;
};

// 模拟获取历史聊天记录
export const getHistoryChats = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(generateChatHistory());
    }, 300);
  });
};

// 模拟获取聊天消息
export const getChatMessages = (chatId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(generateMessages(chatId));
    }, 300);
  });
};

// 模拟流式AI回复
export const sendUserMessage = ({ content, files }) => {
  return new Promise((resolve) => {
    // 模拟网络延迟和流式输出
    const delay = Mock.Random.integer(1500, 3500);
    
    setTimeout(() => {
      let response;
      
      // 如果有上传文件
      if (files && files.length > 0) {
        response = {
          content: `我已收到您上传的${files.length}个文件。\n\n` + 
                  `根据文件${files[0].name}中的数据分析，您的储能系统整体状况良好，但存在以下优化空间：\n\n` +
                  `1. 充放电策略可以更加智能化，建议根据电价时段和负荷预测动态调整\n` +
                  `2. 电池模组温度控制需要改进，特别是在高负载情况下\n` +
                  `3. 能量管理系统算法可升级至V2.5版本，提升综合效率约6%\n\n` +
                  `我已生成详细分析报告，您可以在系统分析页面查看完整内容。是否需要我为您制定优化方案？`
        };
      } else {
        response = {
          content: generateEnergyResponse(content)
        };
      }
      
      resolve(response);
    }, delay);
  });
};