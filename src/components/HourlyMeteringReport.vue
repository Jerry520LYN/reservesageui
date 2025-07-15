<template>
  <div class="hourly-metering-report">
    <!-- 头部操作区 -->
    <div class="header-operations">
      <div class="title-box">
        <h3>整点集抄报表</h3>
      </div>
      <div class="filter-box">
        <el-date-picker
          v-model="queryDate"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :disabled-date="disabledDate"
          @change="handleDateChange"
        />
        <el-button type="primary" @click="queryData">查询</el-button>
        <el-button type="success" @click="exportReport">导出报表</el-button>
      </div>
    </div>

    <!-- 报表状态指示区 -->
    <div class="status-indicator">
      <el-tag v-if="dataLoaded" type="success">数据加载成功</el-tag>
      <el-tag v-else type="info">请选择日期查询数据</el-tag>
      <span class="update-time" v-if="dataLoaded">最后更新时间: {{ lastUpdateTime }}</span>
    </div>

    <!-- 主要图表区域 -->
    <div class="charts-container">
      <!-- 电量曲线图 -->
      <div class="chart-box power-curve" id="powerCurveChart"></div>
      
      <!-- 充放电状态柱状图 -->
      <div class="chart-box charge-discharge" id="chargeDischargeChart"></div>
      
      <!-- SOC变化趋势图 -->
      <div class="chart-box soc-trend" id="socTrendChart"></div>
      
      <!-- 电站运行状态饼图 -->
      <div class="chart-box operation-status" id="operationStatusChart"></div>
      
      <!-- 电价与收益对比图 -->
      <div class="chart-box income-analysis" id="incomeAnalysisChart"></div>
      
      <!-- 环境参数监测图 -->
      <div class="chart-box environment-params" id="environmentParamsChart"></div>
    </div>

    <!-- 数据表格展示 -->
    <div class="data-table">
      <el-table :data="tableData" border style="width: 100%" height="300" v-if="dataLoaded">
        <el-table-column prop="time" label="时间点" width="180" />
        <el-table-column prop="power" label="功率(kW)" width="120" />
        <el-table-column prop="energy" label="电量(kWh)" width="120" />
        <el-table-column prop="soc" label="SOC(%)" width="100" />
        <el-table-column prop="chargeStatus" label="充放电状态" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.chargeStatus === '充电' ? 'success' : (scope.row.chargeStatus === '放电' ? 'danger' : 'info')">
              {{ scope.row.chargeStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="电价(元/kWh)" width="130" />
        <el-table-column prop="income" label="收益(元)" width="120" />
        <el-table-column prop="temperature" label="温度(℃)" width="120" />
        <el-table-column prop="humidity" label="湿度(%)" width="120" />
      </el-table>
      <div class="empty-data" v-else>
        <el-empty description="暂无数据，请选择日期查询"></el-empty>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

export default {
  name: 'HourlyMeteringReport',
  setup() {
    // 数据状态
    const dataLoaded = ref(false)
    const lastUpdateTime = ref('')
    const queryDate = ref('')
    const tableData = ref([])
    
    // 图表实例
    let powerCurveChart = null
    let chargeDischargeChart = null
    let socTrendChart = null
    let operationStatusChart = null
    let incomeAnalysisChart = null
    let environmentParamsChart = null

    // 限制日期选择 - 不能选择未来日期
    const disabledDate = (time) => {
      return time.getTime() > Date.now()
    }

    // 处理日期变化
    const handleDateChange = (val) => {
      if (val) {
        queryDate.value = val
      }
    }

    // 查询数据
    const queryData = async () => {
      if (!queryDate.value) {
        ElMessage.warning('请先选择查询日期')
        return
      }

      try {
        // 实际项目中这里应该是API调用
        // 这里模拟API请求获取数据
        await mockApiRequest()
        
        lastUpdateTime.value = new Date().toLocaleString()
        dataLoaded.value = true
        
        // 初始化图表
        await nextTick()
        initCharts()
      } catch (error) {
        ElMessage.error('数据加载失败: ' + error.message)
      }
    }

    // 模拟API请求，生成测试数据
    const mockApiRequest = () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          // 生成24小时的数据
          const hours = Array.from({ length: 24 }, (_, i) => i)
          tableData.value = hours.map(hour => {
            const timeStr = `${hour.toString().padStart(2, '0')}:00`
            const isCharging = hour >= 0 && hour < 8 // 0-8点充电
            const isDischarging = hour >= 16 && hour < 22 // 16-22点放电
            const chargeStatus = isCharging ? '充电' : (isDischarging ? '放电' : '待机')
            
            return {
              time: timeStr,
              power: isCharging ? Math.round(Math.random() * 100 + 50) : 
                     (isDischarging ? -Math.round(Math.random() * 100 + 50) : Math.round(Math.random() * 10)),
              energy: Math.round(Math.random() * 200 + 100),
              soc: Math.min(100, Math.max(20, Math.round(50 + (isCharging ? 2 : -3) * hour + Math.random() * 5))),
              chargeStatus: chargeStatus,
              price: (isDischarging ? (Math.random() * 0.5 + 1.2).toFixed(2) : (Math.random() * 0.3 + 0.4).toFixed(2)),
              income: isDischarging ? Math.round(Math.random() * 1000 + 500) : 0,
              temperature: (Math.random() * 10 + 20).toFixed(1),
              humidity: Math.round(Math.random() * 20 + 50),
            }
          })
          resolve(tableData.value)
        }, 1000)
      })
    }

    // 导出报表功能
    const exportReport = () => {
      if (!dataLoaded.value) {
        ElMessage.warning('暂无数据可导出，请先查询数据')
        return
      }
      
      ElMessage.success(`报表已导出：整点集抄报表_${queryDate.value}.xlsx`)
      // 实际项目中这里应该调用导出API或使用前端导出库
    }

    // 初始化所有图表
    const initCharts = () => {
      initPowerCurveChart()
      initChargeDischargeChart()
      initSocTrendChart()
      initOperationStatusChart()
      initIncomeAnalysisChart()
      initEnvironmentParamsChart()
    }

    // 初始化电量/功率曲线图
    const initPowerCurveChart = () => {
      if (powerCurveChart != null) {
        powerCurveChart.dispose()
      }
      
      const chartDom = document.getElementById('powerCurveChart')
      powerCurveChart = echarts.init(chartDom)
      
      const times = tableData.value.map(item => item.time)
      const powers = tableData.value.map(item => item.power)
      const energies = tableData.value.map(item => item.energy)
      
      const option = {
        title: {
          text: '整点电量/功率曲线',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        legend: {
          data: ['功率(kW)', '电量(kWh)'],
          bottom: '0'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '12%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: times,
          axisLabel: {
            interval: 2
          }
        },
        yAxis: [
          {
            type: 'value',
            name: '功率(kW)',
            position: 'left',
            axisLine: {
              show: true,
              lineStyle: {
                color: '#5470C6'
              }
            }
          },
          {
            type: 'value',
            name: '电量(kWh)',
            position: 'right',
            axisLine: {
              show: true,
              lineStyle: {
                color: '#91CC75'
              }
            }
          }
        ],
        series: [
          {
            name: '功率(kW)',
            type: 'line',
            data: powers,
            yAxisIndex: 0,
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: {
              color: '#5470C6'
            },
            markArea: {
              itemStyle: {
                color: 'rgba(255, 173, 177, 0.2)'
              },
              data: [
                [
                  { xAxis: '16:00' },
                  { xAxis: '22:00' }
                ]
              ]
            }
          },
          {
            name: '电量(kWh)',
            type: 'line',
            data: energies,
            yAxisIndex: 1,
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: {
              color: '#91CC75'
            }
          }
        ]
      }
      
      powerCurveChart.setOption(option)
      window.addEventListener('resize', () => powerCurveChart.resize())
    }
    
    // 初始化充放电状态柱状图
    const initChargeDischargeChart = () => {
      if (chargeDischargeChart != null) {
        chargeDischargeChart.dispose()
      }
      
      const chartDom = document.getElementById('chargeDischargeChart')
      chargeDischargeChart = echarts.init(chartDom)
      
      const times = tableData.value.map(item => item.time)
      const chargePowers = tableData.value.map(item => item.power > 0 ? item.power : 0)
      const dischargePowers = tableData.value.map(item => item.power < 0 ? -item.power : 0)
      
      const option = {
        title: {
          text: '整点充放电状态',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: function (params) {
            const time = params[0].axisValue
            let result = `${time}<br/>`
            
            params.forEach(param => {
              if (param.value > 0) {
                result += `${param.seriesName}: ${param.value} kW<br/>`
              }
            })
            
            return result
          }
        },
        legend: {
          data: ['充电功率', '放电功率'],
          bottom: '0'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '12%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: times,
          axisLabel: {
            interval: 2
          }
        },
        yAxis: {
          type: 'value',
          name: '功率(kW)'
        },
        series: [
          {
            name: '充电功率',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: chargePowers,
            itemStyle: {
              color: '#91CC75'
            }
          },
          {
            name: '放电功率',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: dischargePowers,
            itemStyle: {
              color: '#EE6666'
            }
          }
        ]
      }
      
      chargeDischargeChart.setOption(option)
      window.addEventListener('resize', () => chargeDischargeChart.resize())
    }
    
    // 初始化SOC变化趋势图
    const initSocTrendChart = () => {
      if (socTrendChart != null) {
        socTrendChart.dispose()
      }
      
      const chartDom = document.getElementById('socTrendChart')
      socTrendChart = echarts.init(chartDom)
      
      const times = tableData.value.map(item => item.time)
      const socValues = tableData.value.map(item => item.soc)
      
      const option = {
        title: {
          text: 'SOC变化趋势',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          formatter: '{b}<br/>{a}: {c}%'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '12%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: times,
          axisLabel: {
            interval: 2
          }
        },
        yAxis: {
          type: 'value',
          name: 'SOC(%)',
          min: 0,
          max: 100,
          interval: 20
        },
        series: [
          {
            name: 'SOC',
            type: 'line',
            data: socValues,
            markLine: {
              silent: true,
              lineStyle: {
                color: '#FAC858'
              },
              data: [
                {
                  yAxis: 80,
                  name: '高SOC警戒线'
                },
                {
                  yAxis: 20,
                  name: '低SOC警戒线'
                }
              ]
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(80, 141, 255, 0.8)' },
                { offset: 1, color: 'rgba(80, 141, 255, 0.1)' }
              ])
            }
          }
        ],
        visualMap: {
          show: false,
          pieces: [
            {
              gt: 80,
              lte: 100,
              color: '#FF6B6B'
            },
            {
              gt: 20,
              lte: 80,
              color: '#508DFF'
            },
            {
              gt: 0,
              lte: 20,
              color: '#FF9E45'
            }
          ]
        }
      }
      
      socTrendChart.setOption(option)
      window.addEventListener('resize', () => socTrendChart.resize())
    }
    
    // 初始化电站运行状态饼图
    const initOperationStatusChart = () => {
      if (operationStatusChart != null) {
        operationStatusChart.dispose()
      }
      
      const chartDom = document.getElementById('operationStatusChart')
      operationStatusChart = echarts.init(chartDom)
      
      // 计算各状态时长
      const statusCounts = {
        charging: 0,
        discharging: 0,
        standby: 0
      }
      
      tableData.value.forEach(item => {
        if (item.chargeStatus === '充电') {
          statusCounts.charging += 1
        } else if (item.chargeStatus === '放电') {
          statusCounts.discharging += 1
        } else {
          statusCounts.standby += 1
        }
      })
      
      const option = {
        title: {
          text: '电站运行状态分布',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c}小时 ({d}%)'
        },
        legend: {
          bottom: '0',
          left: 'center',
          data: ['充电', '放电', '待机']
        },
        series: [
          {
            name: '运行状态',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              formatter: '{b}: {c}h'
            },
            labelLine: {
              show: true
            },
            data: [
              { value: statusCounts.charging, name: '充电', itemStyle: { color: '#91CC75' } },
              { value: statusCounts.discharging, name: '放电', itemStyle: { color: '#EE6666' } },
              { value: statusCounts.standby, name: '待机', itemStyle: { color: '#73C0DE' } }
            ]
          }
        ]
      }
      
      operationStatusChart.setOption(option)
      window.addEventListener('resize', () => operationStatusChart.resize())
    }
    
    // 初始化电价与收益对比图
    const initIncomeAnalysisChart = () => {
      if (incomeAnalysisChart != null) {
        incomeAnalysisChart.dispose()
      }
      
      const chartDom = document.getElementById('incomeAnalysisChart')
      incomeAnalysisChart = echarts.init(chartDom)
      
      const times = tableData.value.map(item => item.time)
      const prices = tableData.value.map(item => parseFloat(item.price))
      const incomes = tableData.value.map(item => item.income)
      
      const option = {
        title: {
          text: '电价与收益分析',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        legend: {
          data: ['电价(元/kWh)', '收益(元)'],
          bottom: '0'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '12%',
          top: '15%',
          containLabel: true
        },
        xAxis: [
          {
            type: 'category',
            data: times,
            axisLabel: {
              interval: 2
            }
          }
        ],
        yAxis: [
          {
            type: 'value',
            name: '电价(元/kWh)',
            position: 'left',
            axisLine: {
              show: true,
              lineStyle: {
                color: '#5470C6'
              }
            },
            min: 0,
            max: 2
          },
          {
            type: 'value',
            name: '收益(元)',
            position: 'right',
            axisLine: {
              show: true,
              lineStyle: {
                color: '#91CC75'
              }
            }
          }
        ],
        series: [
          {
            name: '电价(元/kWh)',
            type: 'line',
            yAxisIndex: 0,
            data: prices,
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: {
              color: '#5470C6'
            }
          },
          {
            name: '收益(元)',
            type: 'bar',
            yAxisIndex: 1,
            data: incomes,
            itemStyle: {
              color: '#91CC75'
            }
          }
        ]
      }
      
      incomeAnalysisChart.setOption(option)
      window.addEventListener('resize', () => incomeAnalysisChart.resize())
    }
    
    // 初始化环境参数监测图
    const initEnvironmentParamsChart = () => {
      if (environmentParamsChart != null) {
        environmentParamsChart.dispose()
      }
      
      const chartDom = document.getElementById('environmentParamsChart')
      environmentParamsChart = echarts.init(chartDom)
      
      const times = tableData.value.map(item => item.time)
      const temperatures = tableData.value.map(item => parseFloat(item.temperature))
      const humidities = tableData.value.map(item => item.humidity)
      
      const option = {
        title: {
          text: '环境参数监测',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        legend: {
          data: ['温度(℃)', '湿度(%)'],
          bottom: '0'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '12%',
          top: '15%',
          containLabel: true
        },
        xAxis: [
          {
            type: 'category',
            data: times,
            axisLabel: {
              interval: 2
            }
          }
        ],
        yAxis: [
          {
            type: 'value',
            name: '温度(℃)',
            position: 'left',
            axisLine: {
              show: true,
              lineStyle: {
                color: '#EE6666'
              }
            },
            min: 10,
            max: 40
          },
          {
            type: 'value',
            name: '湿度(%)',
            position: 'right',
            axisLine: {
              show: true,
              lineStyle: {
                color: '#73C0DE'
              }
            },
            min: 0,
            max: 100
          }
        ],
        series: [
          {
            name: '温度(℃)',
            type: 'line',
            yAxisIndex: 0,
            data: temperatures,
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: {
              color: '#EE6666'
            },
            markLine: {
              silent: true,
              lineStyle: {
                color: '#FF9E45'
              },
              data: [
                {
                  yAxis: 35,
                  name: '高温警戒线'
                }
              ]
            }
          },
          {
            name: '湿度(%)',
            type: 'line',
            yAxisIndex: 1,
            data: humidities,
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: {
              color: '#73C0DE'
            }
          }
        ]
      }
      
      environmentParamsChart.setOption(option)
      window.addEventListener('resize', () => environmentParamsChart.resize())
    }

    // 组件挂载后执行
    onMounted(() => {
      // 默认设置今天的日期
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      queryDate.value = `${year}-${month}-${day}`
    })

    return {
      dataLoaded,
      lastUpdateTime,
      queryDate,
      tableData,
      disabledDate,
      handleDateChange,
      queryData,
      exportReport
    }
  }
}
</script>

<style scoped>
.hourly-metering-report {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.header-operations {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title-box h3 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.filter-box {
  display: flex;
  gap: 10px;
  align-items: center;
}

.status-indicator {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.update-time {
  color: #909399;
  font-size: 14px;
}

.charts-container {
  position: relative;
  width: 100%;
  height: 800px;
  margin-bottom: 20px;
}

.chart-box {
  position: absolute;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 10px;
}

/* 电量/功率曲线图 */
.power-curve {
  left: 0;
  top: 0;
  width: 66%;
  height: 380px;
}

/* 充放电状态柱状图 */
.charge-discharge {
  right: 0;
  top: 0;
  width: 32%;
  height: 380px;
}

/* SOC变化趋势图 */
.soc-trend {
  left: 0;
  top: 400px;
  width: 32%;
  height: 380px;
}

/* 电站运行状态饼图 */
.operation-status {
  left: 33.5%;
  top: 400px;
  width: 32%;
  height: 380px;
}

/* 电价与收益对比图 */
.income-analysis {
  right: 0;
  top: 400px;
  width: 32%;
  height: 380px;
}

/* 环境参数监测图 */
.environment-params {
  left: 0;
  bottom: 0;
  width: 100%;
  height: 0px; /* 这个图表暂时不显示，如果需要显示可调整其他图表的位置和大小 */
}

.data-table {
  margin-top: 20px;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.empty-data {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}
</style>