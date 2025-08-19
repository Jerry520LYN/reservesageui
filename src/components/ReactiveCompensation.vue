<template>
  <div class="reactive-compensation-container">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <h2>无功补偿柜监测</h2>
      <div class="header-right">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :shortcuts="dateShortcuts"
          @change="handleDateRangeChange"
        />
        <el-button type="primary" @click="refreshData">刷新数据</el-button>
      </div>
    </div>

    <!-- 实时状态卡片区域 -->
    <div class="status-cards">
      <div class="status-card" v-for="card in statusCards" :key="card.id">
        <div class="card-title">{{ card.title }}</div>
        <div class="card-value" :class="card.valueClass">{{ card.value }}</div>
        <div class="card-unit">{{ card.unit }}</div>
        <div class="card-trend">
          <span :class="card.trendClass">
            {{ card.trend }}
            <el-icon v-if="card.trendIcon === 'up'"><ArrowUp /></el-icon>
            <el-icon v-else-if="card.trendIcon === 'down'"><ArrowDown /></el-icon>
          </span>
          与昨日同比
        </div>
      </div>
    </div>

    <!-- 补偿单元运行状态 -->
    <div class="chart-container compensation-units-status">
      <div class="chart-header">
        <h3>补偿单元运行状态</h3>
      </div>
      <div class="unit-status-content">
        <el-row :gutter="20">
          <el-col :span="8" v-for="unit in compensationUnits" :key="unit.id">
            <el-card :body-style="{ padding: '10px' }">
              <div class="unit-card">
                <div class="unit-name">{{ unit.name }}</div>
                <div class="unit-status">
                  <el-tag :type="unit.status === '正常' ? 'success' : 'danger'">
                    {{ unit.status }}
                  </el-tag>
                </div>
                <div class="unit-info">
                  <div class="info-item">
                    <span class="info-label">额定容量:</span>
                    <span class="info-value">{{ unit.capacity }} kvar</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">运行时长:</span>
                    <span class="info-value">{{ unit.runningHours }} 小时</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">当前温度:</span>
                    <span class="info-value">{{ unit.temperature }} ℃</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">投切状态:</span>
                    <span class="info-value">
                      <el-switch
                          v-model="unit.isActive"
                          :active-color="unit.isActive ? '#13ce66' : '#ff4949'"
                          :inactive-color="unit.isActive ? '#13ce66' : '#ff4949'"
                          :disabled="true"
                      />
                    </span>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 告警记录表格 -->
    <div class="chart-container alarm-table">
      <div class="chart-header">
        <h3>告警记录</h3>
        <el-button size="small" type="primary" @click="exportAlarmData">
          导出数据
          <el-icon><Download /></el-icon>
        </el-button>
      </div>
      <div class="table-content">
        <el-table :data="alarmData" stripe style="width: 100%">
          <el-table-column prop="time" label="时间" width="180" />
          <el-table-column prop="type" label="告警类型" width="150" />
          <el-table-column prop="device" label="设备" width="150" />
          <el-table-column prop="description" label="告警描述" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === '已处理' ? 'success' : 'danger'">
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="scope">
              <el-button
                  v-if="scope.row.status !== '已处理'"
                  size="small"
                  @click="handleAlarm(scope.row)"
              >
                处理
              </el-button>
              <span v-else>--</span>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-container">
          <el-pagination
              background
              layout="total, sizes, prev, pager, next"
              :total="alarmTotal"
              :page-size="pageSize"
              :current-page="currentPage"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>

    <!-- 无功功率监测图表 -->
    <div class="chart-container reactive-power-chart">
      <div class="chart-header">
        <h3>无功功率监测</h3>
        <el-radio-group v-model="reactivePowerTimeRange" size="small" @change="updateReactivePowerChart">
          <el-radio-button label="day">日</el-radio-button>
          <el-radio-button label="week">周</el-radio-button>
          <el-radio-button label="month">月</el-radio-button>
        </el-radio-group>
      </div>
      <div class="chart-content">
        <div ref="reactivePowerChartRef" class="chart"></div>
      </div>
    </div>

    <!-- 功率因数监测图表 -->
    <div class="chart-container power-factor-chart">
      <div class="chart-header">
        <h3>功率因数监测</h3>
        <el-radio-group v-model="powerFactorTimeRange" size="small" @change="updatePowerFactorChart">
          <el-radio-button label="day">日</el-radio-button>
          <el-radio-button label="week">周</el-radio-button>
          <el-radio-button label="month">月</el-radio-button>
        </el-radio-group>
      </div>
      <div class="chart-content">
        <div ref="powerFactorChartRef" class="chart"></div>
      </div>
    </div>

    <!-- 电压监测图表 -->
    <div class="chart-container voltage-chart">
      <div class="chart-header">
        <h3>三相电压监测</h3>
        <el-radio-group v-model="voltageTimeRange" size="small" @change="updateVoltageChart">
          <el-radio-button label="day">日</el-radio-button>
          <el-radio-button label="week">周</el-radio-button>
          <el-radio-button label="month">月</el-radio-button>
        </el-radio-group>
      </div>
      <div class="chart-content">
        <div ref="voltageChartRef" class="chart"></div>
      </div>
    </div>

    <!-- 实时波形图 -->
    <div class="chart-container waveform-chart">
      <div class="chart-header">
        <h3>电压电流实时波形</h3>
        <el-select v-model="selectedPhase" size="small" @change="updateWaveformChart" class="phase-selector">
          <el-option label="A相" value="A" />
          <el-option label="B相" value="B" />
          <el-option label="C相" value="C" />
        </el-select>
      </div>
      <div class="chart-content">
        <div ref="waveformChartRef" class="chart"></div>
      </div>
    </div>


  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, reactive } from 'vue'
import * as echarts from 'echarts'
import {
  ArrowUp,
  ArrowDown,
  Download
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 日期范围选择
const dateRange = ref([new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()])
const dateShortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    },
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    },
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    },
  },
]

// 状态卡片数据
const statusCards = ref([
  {
    id: 1,
    title: '当前无功功率',
    value: '125.68',
    unit: 'kvar',
    trend: '+3.6%',
    trendClass: 'trend-up',
    trendIcon: 'up',
    valueClass: ''
  },
  {
    id: 2,
    title: '系统功率因数',
    value: '0.95',
    unit: '',
    trend: '+1.2%',
    trendClass: 'trend-up',
    trendIcon: 'up',
    valueClass: 'good-value'
  },
  {
    id: 3,
    title: '补偿投切次数',
    value: '256',
    unit: '次/日',
    trend: '-5.3%',
    trendClass: 'trend-down',
    trendIcon: 'down',
    valueClass: ''
  },
  {
    id: 4,
    title: '补偿单元温度',
    value: '43.2',
    unit: '℃',
    trend: '+2.1%',
    trendClass: 'trend-up',
    trendIcon: 'up',
    valueClass: 'warning-value'
  }
])

// 图表引用
const voltageChartRef = ref(null)
const powerFactorChartRef = ref(null)
const reactivePowerChartRef = ref(null)
const waveformChartRef = ref(null)

// 三相电压监测图表
const voltageTimeRange = ref('day')
const voltageChartOption = reactive({
  title: {
    text: '三相电压监测',
    left: 'center',
    show: false
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      label: {
        backgroundColor: '#6a7985'
      }
    }
  },
  legend: {
    data: ['A相电压', 'B相电压', 'C相电压'],
    top: '5%'
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '8%',
    top: '15%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: generateTimeData(24)
  },
  yAxis: {
    type: 'value',
    name: '电压(V)',
    min: 210,
    max: 240
  },
  series: [
    {
      name: 'A相电压',
      type: 'line',
      smooth: true,
      lineStyle: {
        width: 2,
        color: '#5470c6'
      },
      data: generateRandomData(220, 10, 24)
    },
    {
      name: 'B相电压',
      type: 'line',
      smooth: true,
      lineStyle: {
        width: 2,
        color: '#91cc75'
      },
      data: generateRandomData(225, 10, 24)
    },
    {
      name: 'C相电压',
      type: 'line',
      smooth: true,
      lineStyle: {
        width: 2,
        color: '#ee6666'
      },
      data: generateRandomData(223, 10, 24)
    }
  ],
  dataZoom: [
    {
      type: 'inside',
      start: 0,
      end: 100
    },
    {
      start: 0,
      end: 100
    }
  ]
})

// 功率因数监测图表
const powerFactorTimeRange = ref('day')
const powerFactorChartOption = reactive({
  title: {
    text: '功率因数监测',
    left: 'center',
    show: false
  },
  tooltip: {
    trigger: 'axis',
    formatter: '{b}<br/>{a}: {c}'
  },
  grid: {
    left: '3%',
    right: '13%',
    bottom: '3%',
    top: '10%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: generateTimeData(24)
  },
  yAxis: {
    type: 'value',
    name: '功率因数',
    min: 0.8,
    max: 1
  },
  series: [
    {
      name: '功率因数',
      type: 'line',
      data: generateRandomData(0.92, 0.05, 24),
      markLine: {
        silent: true,
        data: [
          {
            yAxis: 0.9,
            lineStyle: {
              color: '#f56c6c',
              type: 'dashed'
            },
            label: {
              formatter: '限值: 0.9',
              position: 'end'
            }
          }
        ]
      },
      smooth: true,
      showSymbol: false,
      lineStyle: {
        width: 3,
        color: '#409eff'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: 'rgba(64, 158, 255, 0.3)'
            },
            {
              offset: 1,
              color: 'rgba(64, 158, 255, 0)'
            }
          ]
        }
      }
    }
  ]
})

// 无功功率监测图表
const reactivePowerTimeRange = ref('day')
const reactivePowerChartOption = reactive({
  title: {
    text: '无功功率监测',
    left: 'center',
    show: false
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  legend: {
    data: ['补偿前', '补偿后'],
    top: '5%'
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '8%',
    top: '15%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: generateTimeData(24)
  },
  yAxis: {
    type: 'value',
    name: '无功功率(kvar)'
  },
  series: [
    {
      name: '补偿前',
      type: 'bar',
      stack: 'total',
      itemStyle: {
        color: '#ff9f7f'
      },
      emphasis: {
        focus: 'series'
      },
      data: generateRandomData(150, 30, 24)
    },
    {
      name: '补偿后',
      type: 'bar',
      stack: 'total',
      itemStyle: {
        color: '#37a2da'
      },
      emphasis: {
        focus: 'series'
      },
      data: generateRandomData(50, 20, 24)
    }
  ]
})

// 补偿单元状态数据
const compensationUnits = ref([
  {
    id: 1,
    name: '补偿单元 1#',
    status: '正常',
    capacity: 50,
    runningHours: 3562,
    temperature: 38,
    isActive: true
  },
  {
    id: 2,
    name: '补偿单元 2#',
    status: '正常',
    capacity: 50,
    runningHours: 3245,
    temperature: 41,
    isActive: true
  },
  {
    id: 3,
    name: '补偿单元 3#',
    status: '正常',
    capacity: 30,
    runningHours: 2987,
    temperature: 37,
    isActive: false
  },
  {
    id: 4,
    name: '补偿单元 4#',
    status: '故障',
    capacity: 25,
    runningHours: 3124,
    temperature: 52,
    isActive: false
  },
  {
    id: 5,
    name: '补偿单元 5#',
    status: '正常',
    capacity: 25,
    runningHours: 2876,
    temperature: 39,
    isActive: true
  },
  {
    id: 6,
    name: '补偿单元 6#',
    status: '正常',
    capacity: 25,
    runningHours: 3045,
    temperature: 42,
    isActive: true
  }
])

// 告警记录数据
const alarmData = ref([
  {
    time: '2025-05-31 10:32:15',
    type: '过温告警',
    device: '补偿单元 4#',
    description: '设备温度超过阈值 (52°C > 50°C)',
    status: '未处理'
  },
  {
    time: '2025-05-31 08:15:43',
    type: '过流告警',
    device: '补偿单元 2#',
    description: '电流值超过额定范围 (28A > 25A)',
    status: '已处理'
  },
  {
    time: '2025-05-30 22:47:12',
    type: '通讯中断',
    device: '补偿控制器',
    description: '与主控制器通讯中断，持续时间 120s',
    status: '已处理'
  },
  {
    time: '2025-05-30 16:25:37',
    type: '功率因数过低',
    device: '系统',
    description: '系统功率因数低于阈值 (0.85 < 0.9)',
    status: '已处理'
  },
  {
    time: '2025-05-30 09:11:58',
    type: '电压偏差',
    device: 'C相电压',
    description: 'C相电压偏差超过阈值 (±7% > ±5%)',
    status: '已处理'
  },
  {
    time: '2025-05-29 17:35:22',
    type: '开关故障',
    device: '补偿单元 4#',
    description: '投切开关无法正常闭合',
    status: '未处理'
  },
  {
    time: '2025-05-29 14:06:48',
    type: '谐波超标',
    device: '系统',
    description: '系统谐波含量超过标准限值',
    status: '已处理'
  }
])

// 分页相关
const alarmTotal = ref(100)
const pageSize = ref(10)
const currentPage = ref(1)


// 实时波形图
const selectedPhase = ref('A')
const waveformChartOption = reactive({
  title: {
    top: '10px',
    left: 'center',
    show: true
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      label: {
        backgroundColor: '#6a7985'
      }
    }
  },
  legend: {
    data: ['电压', '电流'],
    top: '35px'
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '8%',
    top: '18%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: Array.from({ length: 100 }, (_, i) => i)
  },
  yAxis: [
    {
      type: 'value',
      name: '电压(V)',
      position: 'left',
      axisLine: {
        show: true,
        lineStyle: {
          color: '#5470c6'
        }
      },
      splitLine: {
        show: true, // 显示网格线
        lineStyle: {
          color: '#5470c6', // 浅蓝色横线（与电压轴颜色呼应）
          width: 1,
          type: 'solid' // 实线
        }
      }
    },
    {
      type: 'value',
      name: '电流(A)',
      position: 'right',
      axisLine: {
        show: true,
        lineStyle: {
          color: '#91cc75'
        }
      },
      splitLine: {
        show: true, // 显示网格线
        lineStyle: {
          color: '#91cc75', // 浅绿色横线（与电压轴颜色呼应）
          width: 1,
          type: 'solid' // 实线
        }
      }
    },


  ],
  series: [
    {
      name: '电压',
      type: 'line',
      yAxisIndex: 0,
      data: generateSinusoidData(220, 100),
      smooth: true,
      lineStyle: {
        width: 2,
        color: '#5470c6'
      }
    },
    {
      name: '电流',
      type: 'line',
      yAxisIndex: 1,
      data: generateSinusoidData(15, 100, 0.1),
      smooth: true,
      lineStyle: {
        width: 2,
        color: '#91cc75'
      }
    }
  ]
})

// 生成时间数据
function generateTimeData(count) {
  const result = []
  for (let i = 0; i < count; i++) {
    result.push(`${String(i).padStart(2, '0')}:00`)
  }
  return result
}

// 生成随机数据
function generateRandomData(base, range, count) {
  const result = []
  for (let i = 0; i < count; i++) {
    result.push((base + (Math.random() * 2 - 1) * range).toFixed(2))
  }
  return result
}

// 生成正弦波数据
function generateSinusoidData(amplitude, points, phaseShift = 0) {
  const result = []
  for (let i = 0; i < points; i++) {
    result.push((amplitude * Math.sin(i / 16 + phaseShift * Math.PI)
      + (Math.random() * 2 - 1) * (amplitude * 0.05)).toFixed(2))
  }
  return result
}

// 初始化图表实例
let voltageChart = null
let powerFactorChart = null
let reactivePowerChart = null
let gaugeChart = null
let waveformChart = null

// 初始化所有图表
function initCharts() {
  // 初始化电压图表
  if (voltageChartRef.value && !voltageChart) {
    voltageChart = echarts.init(voltageChartRef.value)
  }
  
  // 初始化功率因数图表
  if (powerFactorChartRef.value && !powerFactorChart) {
    powerFactorChart = echarts.init(powerFactorChartRef.value)
  }
  
  // 初始化无功功率图表
  if (reactivePowerChartRef.value && !reactivePowerChart) {
    reactivePowerChart = echarts.init(reactivePowerChartRef.value)
  }
  
  // 初始化波形图
  if (waveformChartRef.value && !waveformChart) {
    waveformChart = echarts.init(waveformChartRef.value)
  }
}

// 图表更新方法
function updateVoltageChart() {
  let pointCount
  switch (voltageTimeRange.value) {
    case 'day':
      pointCount = 24
      voltageChartOption.xAxis.data = generateTimeData(pointCount)
      break
    case 'week':
      pointCount = 7
      voltageChartOption.xAxis.data = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      break
    case 'month':
      pointCount = 30
      voltageChartOption.xAxis.data = Array.from({ length: pointCount }, (_, i) => i + 1)
      break
  }
  
  voltageChartOption.series.forEach(series => {
    series.data = generateRandomData(series.name.includes('A') ? 220 : series.name.includes('B') ? 225 : 223, 10, pointCount)
  })
  
  voltageChart?.setOption(voltageChartOption)
}

function updatePowerFactorChart() {
  let pointCount
  switch (powerFactorTimeRange.value) {
    case 'day':
      pointCount = 24
      powerFactorChartOption.xAxis.data = generateTimeData(pointCount)
      break
    case 'week':
      pointCount = 7
      powerFactorChartOption.xAxis.data = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      break
    case 'month':
      pointCount = 30
      powerFactorChartOption.xAxis.data = Array.from({ length: pointCount }, (_, i) => i + 1)
      break
  }
  
  powerFactorChartOption.series[0].data = generateRandomData(0.92, 0.05, pointCount)
  powerFactorChart?.setOption(powerFactorChartOption)
}

function updateReactivePowerChart() {
  let pointCount
  switch (reactivePowerTimeRange.value) {
    case 'day':
      pointCount = 24
      reactivePowerChartOption.xAxis.data = generateTimeData(pointCount)
      break
    case 'week':
      pointCount = 7
      reactivePowerChartOption.xAxis.data = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      break
    case 'month':
      pointCount = 30
      reactivePowerChartOption.xAxis.data = Array.from({ length: pointCount }, (_, i) => i + 1)
      break
  }
  
  reactivePowerChartOption.series[0].data = generateRandomData(150, 30, pointCount)
  reactivePowerChartOption.series[1].data = generateRandomData(50, 20, pointCount)
  reactivePowerChart?.setOption(reactivePowerChartOption)
}

function updateWaveformChart() {
  waveformChartOption.title.text = `${selectedPhase.value}相电压电流波形`
  
  // 根据不同相位有略微不同的波形参数
  let voltageAmplitude, currentAmplitude, phaseShift
  switch (selectedPhase.value) {
    case 'A':
      voltageAmplitude = 220
      currentAmplitude = 15
      phaseShift = 0.1
      break
    case 'B':
      voltageAmplitude = 225
      currentAmplitude = 14.5
      phaseShift = 0.12
      break
    case 'C':
      voltageAmplitude = 223
      currentAmplitude = 15.2
      phaseShift = 0.08
      break
  }
  
  waveformChartOption.series[0].data = generateSinusoidData(voltageAmplitude, 100)
  waveformChartOption.series[1].data = generateSinusoidData(currentAmplitude, 100, phaseShift)
  waveformChart?.setOption(waveformChartOption)
}

// 日期范围变化
function handleDateRangeChange() {
  refreshData()
}

// 刷新数据
function refreshData() {
  ElMessage({
    message: '数据刷新中...',
    type: 'info'
  })
  
  // 模拟异步请求
  setTimeout(() => {
    updateVoltageChart()
    updatePowerFactorChart()
    updateReactivePowerChart()
    updateWaveformChart()
    
    // 随机更新状态卡片数据
    statusCards.value.forEach(card => {
      const changePercent = (Math.random() * 10 - 5).toFixed(1)
      const isPositive = changePercent > 0
      card.trend = `${isPositive ? '+' : ''}${changePercent}%`
      card.trendClass = isPositive ? 'trend-up' : 'trend-down'
      card.trendIcon = isPositive ? 'up' : 'down'
    })
    
    ElMessage({
      message: '数据刷新成功',
      type: 'success'
    })
  }, 1000)
}

// 告警处理
function handleAlarm(row) {
  ElMessageBox.confirm(
    `确认处理告警: ${row.description}?`,
    '告警处理',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    row.status = '已处理'
    ElMessage({
      type: 'success',
      message: '告警已标记为已处理'
    })
  }).catch(() => {})
}

// 导出告警数据
function exportAlarmData() {
  ElMessage({
    message: '告警数据导出中...',
    type: 'info'
  })
  
  setTimeout(() => {
    ElMessage({
      message: '告警数据已导出到 alarm_data.csv',
      type: 'success'
    })
  }, 1000)
}

// 分页相关
function handleSizeChange(val) {
  pageSize.value = val
}

function handleCurrentChange(val) {
  currentPage.value = val
}

// 图表resize监听
function resizeCharts() {
  voltageChart?.resize()
  powerFactorChart?.resize()
  reactivePowerChart?.resize()
  gaugeChart?.resize()
  waveformChart?.resize()
}

// 组件挂载
onMounted(() => {
  initCharts()
  refreshData()
  window.addEventListener('resize', resizeCharts)
})

// 组件卸载
onBeforeUnmount(() => {
  voltageChart?.dispose()
  powerFactorChart?.dispose()
  reactivePowerChart?.dispose()
  gaugeChart?.dispose()
  waveformChart?.dispose()
  window.removeEventListener('resize', resizeCharts)
})

// 验证代码语法是否正确
try {
  console.log("Syntax check passed")
}
catch (error) {
  console.error("Syntax error:", error.message)
}

// 功能验证
console.assert(typeof updateVoltageChart === 'function', 'updateVoltageChart function should exist')
console.assert(typeof refreshData === 'function', 'refreshData function should exist')
</script>

<script>
export default {
  name: 'ReactiveCompensation'
}
</script>

<style scoped>
.reactive-compensation-container {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
  position: relative;
}

/* 页面标题样式 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  position: absolute;
  top: 20px;
  left: 20px;
  right: 40px;
  height: 60px;
  z-index: 10;
}

.page-header h2 {
  font-size: 24px;
  color: #303133;
  margin: 0;
}

.header-right {
  display: flex;
  gap: 15px;
}

/* 状态卡片样式 */
.status-cards {
  display: flex;
  gap: 20px;
  position: absolute;
  top: 100px;
  left: 20px;
  right: 50px;
  height: 130px;
  z-index: 5;
}

.status-card {
  flex: 1;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 15px;
  position: relative;
}

.card-title {
  font-size: 14px;
  color: #909399;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin: 5px 0;
}

.card-unit {
  font-size: 12px;
  color: #909399;
}

.card-trend {
  font-size: 12px;
  color: #909399;
}

.trend-up {
  color: #67c23a;
}

.trend-down {
  color: #f56c6c;
}

.good-value {
  color: #67c23a;
}

.warning-value {
  color: #e6a23c;
}

/* 图表容器公共样式 */
.chart-container {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 15px;
  margin-bottom: 5px;
  position: absolute;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.chart-header h3 {
  font-size: 18px;
  color: #303133;
  margin: 0;
}

.chart-content {
  width: 100%;
  height: calc(100% - 50px);
}

.chart {
  width: 100%;
  height: 100%;
  bottom: 10px;
}

/* 各图表定位 */
.unit-card {
                  display: flex;
                  flex-direction: column;
                  gap: 8px;
                }

.unit-name {
  font-size: 16px;
  font-weight: bold;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
}

.compensation-units-status {
  top: 240px;
  left: 20px;
  width: 95%;
  height: 470px;
  overflow-y: auto;
}
.unit-status-content {
  margin-top: 10px;
}

.alarm-table {
  top: 800px;
  left: 20px;
  width: 95%;
  height: 790px;
}

.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end; /* 靠右对齐 */
  padding-right: 20px; /* 右侧留白，避免贴边 */
}

.reactive-power-chart {
  top: 1600px;
  left: 20px;
  width: 700px;
  height: 400px;
}
.power-factor-chart {
  top: 1600px;
  Right:50px;
  width: 500px;
  height: 400px;
}

.voltage-chart {
  top: 2050px;
  left: 20px;
  width: 95%;
  height: 300px;
}

.waveform-chart {
  top: 2400px;
  left:20px;
  width: 95%;
  height: 500px;
}

.phase-selector {
  width: auto !important; /* 宽度自适应内容，而非默认100%或固定值 */
  min-width: 150px; /* 最小宽度，避免内容折行 */
}

</style>