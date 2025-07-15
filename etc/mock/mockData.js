// mockData.js - 使用Mock.js生成模拟数据
import Mock from 'mockjs'

// 设置全局延时，模拟真实请求延迟
Mock.setup({
  timeout: '200-600'
})

// 温度波动范围
const tempFluctuation = 3
// 预设温度基准值
const baseTemperatures = {
  battery: {
    normal: 25,
    warning: 35,
    danger: 45
  },
  transformer: {
    normal: 40,
    warning: 60,
    danger: 75
  },
  inverter: {
    normal: 35,
    warning: 50,
    danger: 65
  }
}

// 电池健康状态分类
const healthStates = ['优', '良', '中', '差']
const healthStateColors = ['#67C23A', '#E6A23C', '#F56C6C', '#909399']

// 生成电池组模拟数据
export function generateBatteryGroupData() {
  const batteries = []
  for (let i = 1; i <= 48; i++) {
    const baseTemp = baseTemperatures.battery.normal
    const healthIndex = Mock.Random.integer(0, 100)
    const healthState = healthIndex > 80 ? 0 : healthIndex > 60 ? 1 : healthIndex > 40 ? 2 : 3
    
    batteries.push({
      id: `battery-${i}`,
      name: `电池${i}`,
      temperature: +(baseTemp + Mock.Random.float(-tempFluctuation, tempFluctuation)).toFixed(1),
      voltage: +(3.2 + Mock.Random.float(-0.2, 0.2)).toFixed(2),
      current: +(10 + Mock.Random.float(-2, 2)).toFixed(2),
      soc: Mock.Random.integer(20, 90),
      soh: Mock.Random.integer(60, 100),
      healthIndex: healthIndex,
      healthState: healthStates[healthState],
      healthStateColor: healthStateColors[healthState],
      cycles: Mock.Random.integer(100, 1500),
      lastUpdated: new Date().toISOString()
    })
  }
  return batteries
}

// 生成温度热力图数据
export function generateHeatmapData(rows = 6, cols = 8, deviceType = 'battery') {
  const baseTemp = baseTemperatures[deviceType].normal
  const data = []
  for (let i = 0; i < rows; i++) {
    const row = []
    for (let j = 0; j < cols; j++) {
      // 为相邻单元格创建平滑的温度渐变
      const tempOffset = Math.sin(i * 0.5) * Math.cos(j * 0.5) * tempFluctuation
      row.push(+(baseTemp + tempOffset).toFixed(1))
    }
    data.push(row)
  }
  return data
}

// 生成历史温度趋势数据
export function generateHistoricalTrend(hours = 24, interval = 'hour', deviceType = 'battery') {
  const baseTemp = baseTemperatures[deviceType].normal
  const now = new Date()
  const data = []
  
  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000)
    // 模拟一天内的温度波动，早晨和午夜较低，下午较高
    const hourFactor = Math.sin((time.getHours() - 6) * Math.PI / 12)
    const tempValue = baseTemp + hourFactor * tempFluctuation / 2 + Mock.Random.float(-1, 1)
    
    data.push({
      time: time.toISOString(),
      temperature: +tempValue.toFixed(1)
    })
  }
  
  return data
}

// 生成预测温度趋势数据
export function generatePredictionTrend(hours = 24, deviceType = 'battery', currentTemp = null) {
  const baseTemp = currentTemp || baseTemperatures[deviceType].normal
  const now = new Date()
  const data = []
  
  // 随机生成温度变化趋势
  // 0: 稳定, 1: 上升, -1: 下降
  const trendDirection = Mock.Random.pick([0, 1, -1])
  const trendStrength = Mock.Random.float(0.5, 2.5)
  
  for (let i = 0; i <= hours; i++) {
    const time = new Date(now.getTime() + i * 3600000)
    
    // 基础预测：考虑时间因素和预设趋势
    const hourFactor = Math.sin((time.getHours() - 6) * Math.PI / 12)
    let predictedTemp = baseTemp
    
    // 添加时间因素的波动
    predictedTemp += hourFactor * tempFluctuation / 2
    
    // 添加预设趋势
    predictedTemp += trendDirection * (i / hours) * trendStrength * tempFluctuation
    
    // 添加小的随机波动
    predictedTemp += Mock.Random.float(-0.3, 0.3)
    
    data.push({
      time: time.toISOString(),
      predictedTemp: +predictedTemp.toFixed(1)
    })
  }
  
  return data
}

// 生成AI风险评估结果
export function generateRiskAssessment(deviceId = 'battery-group-1') {
  const riskScores = {
    overheating: Mock.Random.integer(0, 100),
    shorting: Mock.Random.integer(0, 100),
    aging: Mock.Random.integer(0, 100),
    overcharging: Mock.Random.integer(0, 100)
  }
  
  // 计算总体风险
  const totalRiskScore = Math.floor(
    (riskScores.overheating * 0.4) + 
    (riskScores.shorting * 0.3) + 
    (riskScores.aging * 0.2) + 
    (riskScores.overcharging * 0.1)
  )
  
  const getRiskLevel = (score) => {
    if (score < 20) return { level: '低', color: '#67C23A' }
    if (score < 50) return { level: '中', color: '#E6A23C' }
    if (score < 80) return { level: '高', color: '#F56C6C' }
    return { level: '极高', color: '#FF0000' }
  }
  
  const totalRisk = getRiskLevel(totalRiskScore)
  
  // 风险趋势 (上升、下降、稳定)
  const trendOptions = ['上升', '下降', '稳定']
  const riskTrend = Mock.Random.pick(trendOptions)
  
  // 生成风险预测趋势数据(未来7天)
  const predictionDays = 7
  const riskPredictionTrend = []
  let currentRisk = totalRiskScore
  
  for (let i = 0; i <= predictionDays; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    
    // 根据趋势调整风险值
    if (riskTrend === '上升') {
      currentRisk = Math.min(100, currentRisk + Mock.Random.integer(1, 5))
    } else if (riskTrend === '下降') {
      currentRisk = Math.max(0, currentRisk - Mock.Random.integer(1, 5))
    } else {
      currentRisk = Math.max(0, Math.min(100, currentRisk + Mock.Random.integer(-2, 2)))
    }
    
    riskPredictionTrend.push({
      date: date.toISOString().split('T')[0],
      risk: currentRisk
    })
  }
  
  // 生成推荐措施
  const recommendations = [
    '加强定期温度监测',
    '检查冷却系统',
    '优化充放电策略',
    '调整电池均衡',
    '排查异常电池',
    '降低充电电流',
  ]
  
  // 根据风险等级选择推荐措施数量
  const recommendationCount = totalRisk.level === '低' ? 1 : 
                             totalRisk.level === '中' ? 2 : 
                             totalRisk.level === '高' ? 3 : 4
  
  const selectedRecommendations = Mock.Random.shuffle(recommendations).slice(0, recommendationCount)
  
  return {
    deviceId,
    assessmentTime: new Date().toISOString(),
    riskScores,
    totalRiskScore,
    totalRisk,
    riskTrend,
    riskPredictionTrend,
    recommendations: selectedRecommendations
  }
}

// 模拟报警数据
export function generateAlertsData(count = 3) {
  const alerts = []
  const alertTypes = ['温度异常', '电压异常', '电流异常', 'SOC过低', 'SOH衰减']
  const deviceTypes = ['电池组', '变压器', '逆变器', 'PCS']
  
  for (let i = 0; i < count; i++) {
    const alertType = Mock.Random.pick(alertTypes)
    const deviceType = Mock.Random.pick(deviceTypes)
    const deviceId = `${deviceType}-${Mock.Random.integer(1, 10)}`
    const severity = Mock.Random.pick(['warning', 'error', 'info'])
    
    alerts.push({
      id: Mock.mock('@guid'),
      type: alertType,
      title: `${deviceType} ${alertType}`,
      deviceId: deviceId,
      deviceName: `${deviceType} #${deviceId.split('-')[1]}`,
      description: `${deviceType}#${deviceId.split('-')[1]} 出现${alertType}，请检查。`,
      time: new Date(Date.now() - Mock.Random.integer(0, 86400000)).toISOString(),
      severity: severity,
      acknowledged: false
    })
  }
  
  return alerts
}

// 注册API模拟
// 获取电池组数据
Mock.mock('/api/battery-group', 'get', () => {
  return {
    code: 200,
    message: 'success',
    data: {
      batteries: generateBatteryGroupData(),
      timestamp: new Date().getTime()
    }
  }
})

// 获取热力图数据
Mock.mock('/api/heatmap-data', 'get', (options) => {
  const { deviceType = 'battery', rows = 6, cols = 8 } = JSON.parse(options.body || '{}')
  return {
    code: 200,
    message: 'success',
    data: {
      heatmap: generateHeatmapData(rows, cols, deviceType),
      timestamp: new Date().getTime()
    }
  }
})

// 获取历史温度数据
Mock.mock(new RegExp('/api/temperature/history.*'), 'get', (options) => {
  const { deviceType = 'battery', hours = 24 } = JSON.parse(options.body || '{}')
  return {
    code: 200, 
    message: 'success',
    data: {
      history: generateHistoricalTrend(hours, 'hour', deviceType),
      timestamp: new Date().getTime()
    }
  }
})

// 获取温度预测数据
Mock.mock(new RegExp('/api/temperature/prediction.*'), 'get', (options) => {
  const { deviceType = 'battery', hours = 24, currentTemp } = JSON.parse(options.body || '{}')
  return {
    code: 200,
    message: 'success',
    data: {
      prediction: generatePredictionTrend(hours, deviceType, currentTemp),
      timestamp: new Date().getTime()
    }
  }
})

// 获取AI风险评估
Mock.mock(new RegExp('/api/risk-assessment.*'), 'get', (options) => {
  const { deviceId = 'battery-group-1' } = JSON.parse(options.body || '{}')
  return {
    code: 200,
    message: 'success',
    data: generateRiskAssessment(deviceId)
  }
})

// 获取告警数据
Mock.mock('/api/alerts', 'get', () => {
  return {
    code: 200,
    message: 'success',
    data: {
      alerts: generateAlertsData(Mock.Random.integer(0, 5)),
      timestamp: new Date().getTime()
    }
  }
})

export default {
  generateBatteryGroupData,
  generateHeatmapData,
  generateHistoricalTrend,
  generatePredictionTrend,
  generateRiskAssessment,
  generateAlertsData
}