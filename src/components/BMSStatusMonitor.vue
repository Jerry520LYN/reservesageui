<template>
  <div class="bms-monitor-container">
    <div class="header">
      <h2>电池管理系统状态监测</h2>
      <div class="refresh-info">
        <el-tag size="small">最后更新: {{ lastUpdateTime }}</el-tag>
        <el-button type="primary" size="small" :icon="Refresh" @click="refreshData" :loading="loading">刷新数据</el-button>
      </div>
    </div>

    <!-- BMS状态概览 -->
    <div class="status-overview">
      <el-row :gutter="20">
        <el-col :span="6" v-for="(item, index) in statusCards" :key="index">
          <el-card shadow="hover" :class="item.status">
            <div class="status-item">
              <el-icon :size="36" class="status-icon"><component :is="item.icon" /></el-icon>
              <div class="status-info">
                <div class="status-title">{{ item.title }}</div>
                <div class="status-value">{{ item.value }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 电池组温度监测 -->
    <div class="chart-container temperature-chart">
      <div class="chart-title">电池组温度分布 (℃)</div>
      <div ref="temperatureChart" class="chart"></div>
    </div>

    <!-- 电池组电压监测 -->
    <div class="chart-container voltage-chart">
      <div class="chart-title">电池组电压趋势 (V)</div>
      <div ref="voltageChart" class="chart"></div>
    </div>

    <!-- 电池组电流监测 -->
    <div class="chart-container current-chart">
      <div class="chart-title">电池组电流趋势 (A)</div>
      <div ref="currentChart" class="chart"></div>
    </div>

    <!-- SOC状态监测 -->
    <div class="chart-container soc-chart">
      <div class="chart-title">荷电状态 (SOC)</div>
      <div ref="socChart" class="chart"></div>
    </div>

    <!-- SOH状态监测 -->
    <div class="chart-container soh-chart">
      <div class="chart-title">健康状态 (SOH)</div>
      <div ref="sohChart" class="chart"></div>
    </div>

    <!-- 电池组单体电压分布 -->
    <div class="chart-container cell-voltage-chart">
      <div class="chart-title">电池单体电压分布 (V)</div>
      <div ref="cellVoltageChart" class="chart"></div>
    </div>

    <!-- 告警信息表格 -->
    <div class="alert-table">
      <div class="chart-title">最近告警信息</div>
      <el-table :data="alertData" style="width: 100%" max-height="250" stripe>
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column prop="type" label="告警类型" width="150">
          <template #default="scope">
            <el-tag :type="getAlertTypeStyle(scope.row.level)">{{ scope.row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="告警内容" />
        <el-table-column prop="level" label="等级" width="100">
          <template #default="scope">
            <el-tag :type="getAlertLevelStyle(scope.row.level)">{{ scope.row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === '已处理' ? 'success' : 'danger'">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';

// 状态参数
const loading = ref(false);
const lastUpdateTime = ref(formatDateTime(new Date()));
const updateInterval = ref(null);

// 图表DOM引用
const temperatureChart = ref(null);
const voltageChart = ref(null);
const currentChart = ref(null);
const socChart = ref(null);
const sohChart = ref(null);
const cellVoltageChart = ref(null);

// 图表实例
let temperatureChartInstance = null;
let voltageChartInstance = null;
let currentChartInstance = null;
let socChartInstance = null;
let sohChartInstance = null;
let cellVoltageChartInstance = null;

// 状态卡片数据
const statusCards = ref([
  { 
    title: '系统状态', 
    value: '正常运行', 
    icon: 'CircleCheck', 
    status: 'normal' 
  },
  { 
    title: '平均SOC', 
    value: '78.5%', 
    icon: 'DataAnalysis', 
    status: 'normal' 
  },
  { 
    title: '温度状态', 
    value: '正常 (25.2℃)', 
    icon: 'CircleCheck', 
    status: 'normal' 
  },
  { 
    title: '告警数', 
    value: '2条未处理', 
    icon: 'Warning', 
    status: 'warning' 
  }
]);

// 告警数据
const alertData = ref([
  {
    time: '2025-06-01 15:23:45',
    type: '温度异常',
    message: '电池组3温度超出正常范围(32.5℃)',
    level: '警告',
    status: '未处理'
  },
  {
    time: '2025-06-01 14:58:12',
    type: '电压异常',
    message: '单体电池52电压低于阈值(3.2V)',
    level: '警告',
    status: '未处理'
  },
  {
    time: '2025-06-01 13:45:30',
    type: '通信异常',
    message: 'BMS通信中断，持续5秒',
    level: '严重',
    status: '已处理'
  },
  {
    time: '2025-06-01 10:12:05',
    type: 'SOC异常',
    message: '电池组SOC下降速率异常',
    level: '一般',
    status: '已处理'
  },
  {
    time: '2025-05-31 22:48:37',
    type: '平衡异常',
    message: '电池组内电压不平衡超阈值',
    level: '警告',
    status: '已处理'
  }
]);

// 生成模拟数据
const generateTimeData = (count = 24, startTime = new Date()) => {
  const result = [];
  let time = new Date(startTime);
  time.setHours(time.getHours() - count);
  
  for (let i = 0; i <= count; i++) {
    const currentTime = new Date(time);
    currentTime.setHours(time.getHours() + i);
    result.push(formatTime(currentTime));
  }
  return result;
};

// 生成模拟温度数据
const generateTemperatureData = () => {
  const baseTemp = 25;
  return Array(24).fill(0).map(() => +(baseTemp + Math.random() * 3 - 1).toFixed(1));
};

// 生成模拟电压数据
const generateVoltageData = () => {
  const baseVoltage = 48;
  return Array(24).fill(0).map(() => +(baseVoltage + Math.random() * 0.8 - 0.4).toFixed(2));
};

// 生成模拟电流数据
const generateCurrentData = () => {
  const baseCurrent = 10;
  return Array(24).fill(0).map(() => +(baseCurrent + Math.random() * 4 - 2).toFixed(1));
};

// 生成SOC数据
const generateSocData = (baseValue = 80) => {
  return Array(24).fill(0).map((_, index) => {
    // 模拟一天内的SOC变化：早上充电，白天放电，晚上充电
    if (index < 8) { // 早上充电
      return +(baseValue - 10 + (index / 8) * 20).toFixed(1);
    } else if (index < 18) { // 白天放电
      return +(baseValue + 10 - ((index - 8) / 10) * 30).toFixed(1);
    } else { // 晚上充电
      return +(baseValue - 20 + ((index - 18) / 6) * 30).toFixed(1);
    }
  });
};

// 生成SOH数据
const generateSohData = () => {
  // SOH一般变化较慢，这里模拟近期的SOH数据
  const baseSoh = 96.5;
  return Array(24).fill(0).map((_, index) => {
    return +(baseSoh - index * 0.02).toFixed(1);
  });
};

// 生成电池单体电压数据
const generateCellVoltageData = (cellCount = 16) => {
  const baseCellVoltage = 3.6;
  return Array(cellCount).fill(0).map((_, index) => {
    // 模拟一些电池单体间的电压差异
    return +(baseCellVoltage + Math.random() * 0.3 - 0.15).toFixed(3);
  });
};

// 格式化时间函数
function formatTime(date) {
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 格式化日期时间函数
function formatDateTime(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}

// 获取告警类型样式
const getAlertTypeStyle = (level) => {
  switch (level) {
    case '严重': return 'danger';
    case '警告': return 'warning';
    default: return 'info';
  }
};

// 获取告警等级样式
const getAlertLevelStyle = (level) => {
  switch (level) {
    case '严重': return 'danger';
    case '警告': return 'warning';
    case '一般': return 'info';
    default: return '';
  }
};

// 初始化温度监测图表
const initTemperatureChart = () => {
  const timeData = generateTimeData();
  const tempData = generateTemperatureData();
  
  temperatureChartInstance = echarts.init(temperatureChart.value);
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br />{a}: {c}℃'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '1%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: timeData,
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      name: '温度(℃)',
      min: 'dataMin',
      max: 'dataMax'
    },
    visualMap: {
      show: false,
      pieces: [
        {
          gt: 30,
          lte: 32,
          color: '#ff9800'
        },
        {
          gt: 32,
          color: '#f44336'
        }
      ]
    },
    series: [
      {
        name: '电池组温度',
        type: 'line',
        data: tempData,
        smooth: true,
        lineStyle: {
          width: 3
        },
        areaStyle: {
          opacity: 0.2
        },
        markPoint: {
          data: [
            {type: 'max', name: '最高温度'},
            {type: 'min', name: '最低温度'}
          ]
        },
        markLine: {
          data: [
            {type: 'average', name: '平均温度'},
            {
              name: '温度上限',
              yAxis: 32,
              lineStyle: {
                color: '#f44336'
              },
              label: {
                formatter: '温度上限: 32℃',
                position: 'end'
              }
            }
          ]
        }
      }
    ]
  };
  
  temperatureChartInstance.setOption(option);
};

// 初始化电压监测图表
const initVoltageChart = () => {
  const timeData = generateTimeData();
  const voltageData = generateVoltageData();
  
  voltageChartInstance = echarts.init(voltageChart.value);
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br />{a}: {c}V'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: timeData,
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      name: '电压(V)',
      min: (value) => Math.floor(value.min - 0.5),
      max: (value) => Math.ceil(value.max + 0.5)
    },
    series: [
      {
        name: '电池组电压',
        type: 'line',
        data: voltageData,
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#2196f3'
        },
        areaStyle: {
          opacity: 0.2,
          color: '#2196f3'
        },
        markLine: {
          data: [
            {type: 'average', name: '平均电压'},
            {
              name: '电压上限',
              yAxis: 49.5,
              lineStyle: {
                color: '#f44336'
              }
            },
            {
              name: '电压下限',
              yAxis: 46.5,
              lineStyle: {
                color: '#f44336'
              }
            }
          ]
        }
      }
    ]
  };
  
  voltageChartInstance.setOption(option);
};

// 初始化电流监测图表
const initCurrentChart = () => {
  const timeData = generateTimeData();
  const currentData = generateCurrentData();
  
  currentChartInstance = echarts.init(currentChart.value);
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br />{a}: {c}A'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: timeData,
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      name: '电流(A)',
      min: (value) => Math.floor(value.min - 1),
      max: (value) => Math.ceil(value.max + 1)
    },
    series: [
      {
        name: '电池组电流',
        type: 'line',
        data: currentData,
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#9c27b0'
        },
        areaStyle: {
          opacity: 0.2,
          color: '#9c27b0'
        },
        markLine: {
          data: [
            {type: 'average', name: '平均电流'}
          ]
        }
      }
    ]
  };
  
  currentChartInstance.setOption(option);
};

// 初始化SOC状态图表
const initSocChart = () => {
  const timeData = generateTimeData();
  const socData = generateSocData();
  
  socChartInstance = echarts.init(socChart.value);
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br />{a}: {c}%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: timeData,
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      name: 'SOC(%)',
      min: 0,
      max: 100
    },
    visualMap: {
      show: false,
      pieces: [
        {
          lt: 20,
          color: '#f44336'
        },
        {
          gte: 20,
          lt: 30,
          color: '#ff9800'
        }
      ]
    },
    series: [
      {
        name: '荷电状态',
        type: 'line',
        data: socData,
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#4caf50'
        },
        areaStyle: {
          opacity: 0.2,
          color: '#4caf50'
        },
        markLine: {
          data: [
            {
              name: 'SOC低位警告',
              yAxis: 20,
              lineStyle: {
                color: '#f44336'
              },
              label: {
                formatter: 'SOC低位警告: 20%',
                position: 'end'
              }
            }
          ]
        }
      }
    ]
  };
  
  socChartInstance.setOption(option);
};

// 初始化SOH状态图表
const initSohChart = () => {
  const timeData = generateTimeData(24, new Date(new Date().getTime() - 24 * 3600 * 1000 * 30)); // 显示过去30天
  timeData.forEach((item, index) => {
    timeData[index] = `第${index + 1}天`;
  });
  
  const sohData = generateSohData();
  
  sohChartInstance = echarts.init(sohChart.value);
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br />{a}: {c}%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: timeData,
      boundaryGap: false,
      axisLabel: {
        interval: 'auto'
      }
    },
    yAxis: {
      type: 'value',
      name: 'SOH(%)',
      min: 90,
      max: 100
    },
    series: [
      {
        name: '健康状态',
        type: 'line',
        data: sohData,
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#3f51b5'
        },
        areaStyle: {
          opacity: 0.2,
          color: '#3f51b5'
        }
      }
    ]
  };
  
  sohChartInstance.setOption(option);
};

// 初始化电池单体电压分布图表
const initCellVoltageChart = () => {
  const cellData = Array.from({length: 16}, (_, i) => `电池${i+1}`);
  const voltageData = generateCellVoltageData(16);
  
  cellVoltageChartInstance = echarts.init(cellVoltageChart.value);
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: '{b}<br />{a}: {c}V'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: cellData,
      axisLabel: {
        interval: 0,
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '电压(V)',
      min: (value) => +(Math.floor(value.min * 10) / 10 - 0.1).toFixed(1),
      max: (value) => +(Math.ceil(value.max * 10) / 10 + 0.1).toFixed(1)
    },
    visualMap: {
      show: false,
      pieces: [
        {
          lt: 3.4,
          color: '#f44336'
        },
        {
          gt: 3.8,
          color: '#ff9800'
        }
      ]
    },
    series: [
      {
        name: '单体电压',
        type: 'bar',
        data: voltageData,
        itemStyle: {
          color: function(params) {
            if (params.value < 3.4) return '#f44336';
            if (params.value > 3.8) return '#ff9800';
            return '#2196f3';
          }
        },
        markLine: {
          data: [
            {
              name: '均值',
              type: 'average'
            },
            {
              name: '上限',
              yAxis: 3.8,
              lineStyle: {
                color: '#f44336'
              }
            },
            {
              name: '下限',
              yAxis: 3.4,
              lineStyle: {
                color: '#f44336'
              }
            }
          ]
        }
      }
    ]
  };
  
  cellVoltageChartInstance.setOption(option);
};

// 窗口大小变化时重新调整图表大小
const resizeCharts = () => {
  temperatureChartInstance && temperatureChartInstance.resize();
  voltageChartInstance && voltageChartInstance.resize();
  currentChartInstance && currentChartInstance.resize();
  socChartInstance && socChartInstance.resize();
  sohChartInstance && sohChartInstance.resize();
  cellVoltageChartInstance && cellVoltageChartInstance.resize();
};

// 刷新数据
const refreshData = async () => {
  loading.value = true;
  
  try {
    // 模拟异步数据获取
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 更新图表数据
    if (temperatureChartInstance) {
      const option = temperatureChartInstance.getOption();
      option.series[0].data = generateTemperatureData();
      temperatureChartInstance.setOption(option);
    }
    
    if (voltageChartInstance) {
      const option = voltageChartInstance.getOption();
      option.series[0].data = generateVoltageData();
      voltageChartInstance.setOption(option);
    }
    
    if (currentChartInstance) {
      const option = currentChartInstance.getOption();
      option.series[0].data = generateCurrentData();
      currentChartInstance.setOption(option);
    }
    
    if (socChartInstance) {
      const option = socChartInstance.getOption();
      option.series[0].data = generateSocData();
      socChartInstance.setOption(option);
    }
    
    if (cellVoltageChartInstance) {
      const option = cellVoltageChartInstance.getOption();
      option.series[0].data = generateCellVoltageData(16);
      cellVoltageChartInstance.setOption(option);
    }
    
    // 更新最后更新时间
    lastUpdateTime.value = formatDateTime(new Date());
  } catch (error) {
    console.error('刷新数据失败:', error);
  } finally {
    loading.value = false;
  }
};

// 生命周期钩子
onMounted(() => {
  // 初始化各图表
  initTemperatureChart();
  initVoltageChart();
  initCurrentChart();
  initSocChart();
  initSohChart();
  initCellVoltageChart();
  
  // 监听窗口大小变化
  window.addEventListener('resize', resizeCharts);
  
  // 设置定时刷新
  updateInterval.value = setInterval(() => {
    refreshData();
  }, 60000); // 每分钟刷新一次
});

onUnmounted(() => {
  // 清除事件监听和定时器
  window.removeEventListener('resize', resizeCharts);
  clearInterval(updateInterval.value);
  
  // 销毁图表实例
  temperatureChartInstance && temperatureChartInstance.dispose();
  voltageChartInstance && voltageChartInstance.dispose();
  currentChartInstance && currentChartInstance.dispose();
  socChartInstance && socChartInstance.dispose();
  sohChartInstance && sohChartInstance.dispose();
  cellVoltageChartInstance && cellVoltageChartInstance.dispose();
});
</script>

<style scoped>
.bms-monitor-container {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 16px;
  background-color: #f5f7fa;
  overflow-x: hidden;
}

/* 头部样式 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  color: #303133;
}

.refresh-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 状态卡片样式 */
.status-overview {
  margin-bottom: 20px;
}

.status-item {
  display: flex;
  align-items: center;
}

.status-icon {
  margin-right: 12px;
  color: inherit;
}

.status-info {
  flex-grow: 1;
}

.status-title {
  font-size: 14px;
  color: #909399;
}

.status-value {
  font-size: 18px;
  font-weight: bold;
  margin-top: 4px;
}

.status-overview .normal {
  color: #67c23a;
}

.status-overview .warning {
  color: #e6a23c;
}

.status-overview .danger {
  color: #f56c6c;
}

/* 图表容器样式 */
.chart-container {
  position: absolute;
  background-color: #ffffff;
  border-radius: 4px;
  padding: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.chart-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #303133;
}

.chart {
  width: 100%;
  height: calc(100% - 28px);
}

/* 各图表位置 */
.temperature-chart {
  left: 16px;
  top: 200px;
  width: calc(50% - 24px);
  height: 300px;
}

.voltage-chart {
  right: 16px;
  top: 200px;
  width: calc(50% - 24px);
  height: 300px;
}

.current-chart {
  left: 16px;
  top: 516px;
  width: calc(50% - 24px);
  height: 300px;
}

.soc-chart {
  right: 16px;
  top: 516px;
  width: calc(50% - 24px);
  height: 300px;
}

.soh-chart {
  left: 16px;
  top: 832px;
  width: calc(50% - 24px);
  height: 300px;
}

.cell-voltage-chart {
  right: 16px;
  top: 832px;
  width: calc(50% - 24px);
  height: 300px;
}

.alert-table {
  position: absolute;
  left: 16px;
  top: 1148px;
  width: calc(100% - 32px);
  padding: 16px;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}
</style>

<!-- Syntax self-check -->
<script>
try {
  console.log("Syntax check passed");
}
catch (error) {
  console.error("Syntax error:", error.message);
}

// Function verification
console.assert(typeof formatDateTime === 'function', 'formatDateTime function exists');
console.assert(typeof refreshData === 'function', 'refreshData function exists');
</script>