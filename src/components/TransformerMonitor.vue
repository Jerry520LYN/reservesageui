<template>
  <div class="transformer-monitor">
    <!-- 页面标题 -->


    <!-- 变压器状态概览卡片 -->
    <div class="status-card">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <h3>变压器状态概览</h3>
            <el-tag v-if="transformerStatus === 'normal'" type="success" effect="dark">正常运行</el-tag>
            <el-tag v-else-if="transformerStatus === 'warning'" type="warning" effect="dark">警告</el-tag>
            <el-tag v-else type="danger" effect="dark">异常</el-tag>
          </div>
        </template>
        <div class="status-info">
          <div class="status-item">
            <span class="label">设备编号:</span>
            <span class="value">TR-20230001</span>
          </div>
          <div class="status-item">
            <span class="label">变压器类型:</span>
            <span class="value">油浸式</span>
          </div>
          <div class="status-item">
            <span class="label">额定容量:</span>
            <span class="value">1000 kVA</span>
          </div>
          <div class="status-item">
            <span class="label">运行时长:</span>
            <span class="value">{{ runningHours }} 小时</span>
          </div>
          <div class="status-item">
            <span class="label">上次维护:</span>
            <span class="value">2025-05-10</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 温度监测图表 -->
    <div class="chart temperature-chart" ref="temperatureChart"></div>

    <!-- 负载率仪表盘 -->
    <div class="chart load-gauge" ref="loadGauge"></div>

    <!-- 电压监测图表 -->
    <div class="chart voltage-chart" ref="voltageChart"></div>

    <!-- 电流监测图表 -->
    <div class="chart current-chart" ref="currentChart"></div>

    <!-- 功率因数图表 -->
    <div class="chart power-factor-chart" ref="powerFactorChart"></div>

    <!-- 谐波含量图表 -->
    <div class="chart harmonics-chart" ref="harmonicsChart"></div>

    <!-- 实时告警信息 -->
    <div class="alarm-panel">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <h3>告警信息</h3>
            <el-button type="primary" size="small" @click="checkAllAlarms">查看全部</el-button>
          </div>
        </template>
        <el-table :data="alarmData" stripe style="width: 100%" height="200">
          <el-table-column prop="time" label="时间" width="180" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.level === 'critical' ? 'danger' : scope.row.level === 'warning' ? 'warning' : 'info'">
                {{ scope.row.type }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="message" label="内容" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === 'resolved' ? 'success' : 'info'" size="small">
                {{ scope.row.status === 'resolved' ? '已解决' : '未处理' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <h3>控制面板</h3>
          </div>
        </template>
        <div class="control-buttons">
          <el-button type="primary" @click="refreshData">刷新数据</el-button>
          <el-button type="success" @click="exportData">导出报告</el-button>
          <el-button type="warning" @click="manualInspection">手动检测</el-button>
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" @change="handleDateChange" />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import { ElNotification, ElMessageBox } from 'element-plus';

export default {
  name: 'TransformerMonitor',
  setup() {
    // 图表实例引用
    const temperatureChart = ref(null);
    const loadGauge = ref(null);
    const voltageChart = ref(null);
    const currentChart = ref(null);
    const powerFactorChart = ref(null);
    const harmonicsChart = ref(null);
    
    // 图表实例对象
    let temperatureChartInstance = null;
    let loadGaugeInstance = null;
    let voltageChartInstance = null;
    let currentChartInstance = null;
    let powerFactorChartInstance = null;
    let harmonicsChartInstance = null;

    
    // 数据状态
    const transformerStatus = ref('normal'); // normal, warning, danger
    const runningHours = ref(8764);
    const dateRange = ref([]);
    
    // 模拟告警数据
    const alarmData = ref([
      {
        time: '2025-06-01 15:30:22',
        type: '温度告警',
        message: '变压器温度超过警戒值 (85°C)',
        status: 'pending',
        level: 'warning'
      },
      {
        time: '2025-06-01 10:15:07',
        type: '油位告警',
        message: '变压器油位低于安全阈值',
        status: 'pending',
        level: 'warning'
      },
      {
        time: '2025-05-31 23:45:18',
        type: '负载告警',
        message: '变压器负载率达到95%',
        status: 'resolved',
        level: 'critical'
      },
      {
        time: '2025-05-31 14:20:36',
        type: '谐波告警',
        message: '谐波含量超过标准值',
        status: 'resolved',
        level: 'warning'
      }
    ]);
    
    // 模拟实时数据的计时器
    let dataTimer = null;
    
    // 初始化图表方法
    const initCharts = () => {
      // 初始化温度监测图表
      temperatureChartInstance = echarts.init(temperatureChart.value);
      temperatureChartInstance.setOption({
        title: {
          text: '变压器温度监测',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          formatter: '{a} <br/>{b}: {c}°C'
        },
        xAxis: {
          type: 'category',
          data: generateTimeData(24),
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          name: '温度(°C)',
          min: 0,
          max: 120,
          splitLine: {
            show: true
          }
        },
        series: [
          {
            name: '温度',
            type: 'line',
            data: generateTemperatureData(24),
            markLine: {
              data: [
                { yAxis: 90, lineStyle: { color: 'red' }, label: { formatter: '警戒温度' } },
                { yAxis: 75, lineStyle: { color: 'orange' }, label: { formatter: '注意温度' } }
              ]
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(255,107,104,0.4)' },
                  { offset: 1, color: 'rgba(255,107,104,0.1)' }
                ]
              }
            }
          }
        ],
        grid: {
          top: 60,
          right: 30,
          bottom: 60,
          left: 60
        },
        dataZoom: [
          {
            type: 'inside',
            start: 50,
            end: 100
          },
          {
            start: 50,
            end: 100
          }
        ]
      });

      // 初始化负载率仪表盘
      loadGaugeInstance = echarts.init(loadGauge.value);
      loadGaugeInstance.setOption({
        title: {
          text: '变压器负载率',
          left: 'center'
        },
        series: [
          {
            type: 'gauge',
            progress: {
              show: true,
              width: 18
            },
            axisLine: {
              lineStyle: {
                width: 18,
                color: [
                  [0.7, '#67C23A'],
                  [0.9, '#E6A23C'],
                  [1, '#F56C6C']
                ]
              }
            },
            pointer: {
              itemStyle: {
                color: 'auto'
              }
            },
            axisTick: {
              distance: -30,
              length: 8,
              lineStyle: {
                color: '#fff',
                width: 2
              }
            },
            splitLine: {
              distance: -30,
              length: 30,
              lineStyle: {
                color: '#fff',
                width: 4
              }
            },
            axisLabel: {
              color: 'auto',
              distance: 40,
              fontSize: 12
            },
            detail: {
              valueAnimation: true,
              formatter: '{value}%',
              color: 'auto',
              fontSize: 24
            },
            data: [
              {
                value: 68
              }
            ]
          }
        ]
      });

      // 初始化电压监测图表
      voltageChartInstance = echarts.init(voltageChart.value);
      voltageChartInstance.setOption({
        title: {
          text: '变压器电压监测',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        legend: {
          data: ['输入电压', '输出电压'],
          bottom: 10
        },
        xAxis: {
          type: 'category',
          data: generateTimeData(24),
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          name: '电压(V)',
          splitLine: {
            show: true
          }
        },
        series: [
          {
            name: '输入电压',
            type: 'line',
            data: generateVoltageData(24, 10500, 10700),
            smooth: true,
            lineStyle: {
              width: 2
            }
          },
          {
            name: '输出电压',
            type: 'line',
            data: generateVoltageData(24, 380, 420),
            smooth: true,
            lineStyle: {
              width: 2
            }
          }
        ],
        grid: {
          top: 60,
          right: 30,
          bottom: 60,
          left: 60
        }
      });

      // 初始化电流监测图表
      currentChartInstance = echarts.init(currentChart.value);
      currentChartInstance.setOption({
        title: {
          text: '变压器电流监测',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: generateTimeData(24),
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          name: '电流(A)',
          splitLine: {
            show: true
          }
        },
        series: [
          {
            name: '电流',
            type: 'line',
            data: generateCurrentData(24),
            markPoint: {
              data: [
                { type: 'max', name: '最大值' },
                { type: 'min', name: '最小值' }
              ]
            },
            markLine: {
              data: [
                { type: 'average', name: '平均值' }
              ]
            },
            itemStyle: {
              color: '#409EFF'
            }
          }
        ],
        grid: {
          top: 60,
          right: 30,
          bottom: 60,
          left: 60
        }
      });

      // 初始化功率因数图表
      powerFactorChartInstance = echarts.init(powerFactorChart.value);
      powerFactorChartInstance.setOption({
        title: {
          text: '功率因数',
          left: 'center'
        },
        tooltip: {
          formatter: '{a} <br/>{b} : {c}'
        },
        series: [
          {
            name: '功率因数',
            type: 'gauge',
            min: 0,
            max: 1,
            detail: {
              formatter: '{value}',
              fontSize: 18
            },
            data: [
              {
                value: 0.92,
                name: '功率因数'
              }
            ],
            axisLine: {
              lineStyle: {
                color: [
                  [0.75, '#F56C6C'],
                  [0.85, '#E6A23C'],
                  [1, '#67C23A']
                ]
              }
            }
          }
        ]
      });

      // 初始化谐波含量图表
      harmonicsChartInstance = echarts.init(harmonicsChart.value);
      harmonicsChartInstance.setOption({
        title: {
          text: '谐波含量分析',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        xAxis: {
          type: 'category',
          data: ['1次', '2次', '3次', '4次', '5次', '6次', '7次', '8次', '9次', '10次'],
          axisLabel: {
            interval: 0
          }
        },
        yAxis: {
          type: 'value',
          name: '含量(%)',
          max: 10
        },
        series: [
          {
            name: '谐波含量',
            type: 'bar',
            data: [4.2, 0.8, 3.6, 0.5, 2.8, 0.3, 1.5, 0.2, 0.7, 0.1],
            itemStyle: {
              color: function(params) {
                const value = params.value;
                if (value > 3.5) {
                  return '#F56C6C';
                } else if (value > 2) {
                  return '#E6A23C';
                }
                return '#67C23A';
              }
            }
          }
        ],
        grid: {
          top: 60,
          right: 20,
          bottom: 40,
          left: 60
        }
      });

      

      // 监听窗口大小变化，调整图表大小
      window.addEventListener('resize', handleResize);
    };

    // 处理窗口大小变化
    const handleResize = () => {
      temperatureChartInstance?.resize();
      loadGaugeInstance?.resize();
      voltageChartInstance?.resize();
      currentChartInstance?.resize();
      powerFactorChartInstance?.resize();
      harmonicsChartInstance?.resize();
    };

    // 生成时间数据
    const generateTimeData = (count) => {
      const data = [];
      const now = new Date();
      for (let i = count; i > 0; i--) {
        const time = new Date(now - i * 3600 * 1000);
        data.push(time.getHours() + ':00');
      }
      return data;
    };

    // 生成温度数据
    const generateTemperatureData = (count) => {
      const baseTemp = 65;
      const data = [];
      for (let i = 0; i < count; i++) {
        data.push((baseTemp + Math.random() * 15).toFixed(1));
      }
      return data;
    };

    // 生成电压数据
    const generateVoltageData = (count, base, range) => {
      const data = [];
      for (let i = 0; i < count; i++) {
        data.push((base + Math.random() * range).toFixed(1));
      }
      return data;
    };

    // 生成电流数据
    const generateCurrentData = (count) => {
      const baseCurrent = 120;
      const data = [];
      for (let i = 0; i < count; i++) {
        data.push((baseCurrent + Math.random() * 40 - 20).toFixed(1));
      }
      return data;
    };

    // 更新图表数据（模拟实时数据）
    const updateChartData = () => {
      // 更新温度图表
      const tempOption = temperatureChartInstance.getOption();
      const newTempData = [...tempOption.series[0].data];
      newTempData.shift();
      const lastTemp = parseFloat(newTempData[newTempData.length - 1]);
      const newTemp = (lastTemp + Math.random() * 4 - 2).toFixed(1);
      newTempData.push(newTemp);
      
      // 检查温度是否触发告警
      if (newTemp > 85) {
        transformerStatus.value = 'warning';
        showWarningNotification('温度告警', '变压器温度过高: ' + newTemp + '°C');
      }
      
      temperatureChartInstance.setOption({
        series: [
          {
            data: newTempData
          }
        ]
      });

      // 更新负载率仪表盘
      const newLoad = Math.floor(60 + Math.random() * 30);
      loadGaugeInstance.setOption({
        series: [
          {
            data: [
              {
                value: newLoad
              }
            ]
          }
        ]
      });

      // 更新电流图表
      const currentOption = currentChartInstance.getOption();
      const newCurrentData = [...currentOption.series[0].data];
      newCurrentData.shift();
      newCurrentData.push((120 + Math.random() * 40 - 20).toFixed(1));
      currentChartInstance.setOption({
        series: [
          {
            data: newCurrentData
          }
        ]
      });

      // 更新功率因数图表
      const newPowerFactor = (0.85 + Math.random() * 0.12).toFixed(2);
      powerFactorChartInstance.setOption({
        series: [
          {
            data: [
              {
                value: newPowerFactor
              }
            ]
          }
        ]
      });

      
      // 随机更新运行时长
      runningHours.value += 1;
    };

    // 显示警告通知
    const showWarningNotification = (title, message) => {
      ElNotification({
        title,
        message,
        type: 'warning',
        duration: 3000
      });
    };

    // 刷新数据
    const refreshData = () => {
      ElNotification({
        title: '数据刷新',
        message: '正在刷新变压器监测数据...',
        type: 'info',
        duration: 2000
      });
      updateChartData();
    };

    // 导出数据
    const exportData = () => {
      ElMessageBox.confirm('是否导出当前变压器监测数据报告？', '导出确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        ElNotification({
          title: '导出成功',
          message: '变压器监测数据报告已成功导出',
          type: 'success',
          duration: 2000
        });
      }).catch(() => {});
    };

    // 手动检测
    const manualInspection = () => {
      ElNotification({
        title: '手动检测',
        message: '正在执行变压器手动检测...',
        type: 'info',
        duration: 2000
      });
      
      // 模拟检测延迟
      setTimeout(() => {
        ElNotification({
          title: '检测完成',
          message: '变压器各项指标正常',
          type: 'success',
          duration: 2000
        });
      }, 3000);
    };

    // 查看所有告警
    const checkAllAlarms = () => {
      ElMessageBox.alert('显示所有历史告警信息', '告警历史', {
        confirmButtonText: '确定'
      });
    };
    
    // 处理日期变化
    const handleDateChange = (val) => {
      if (val) {
        ElNotification({
          title: '日期已更新',
          message: `数据时间范围已更新为: ${val[0]} 至 ${val[1]}`,
          type: 'success',
          duration: 2000
        });
      }
    };

    // 组件挂载
    onMounted(() => {
      nextTick(() => {
        initCharts();
        
        // 设置定时器，模拟实时数据更新
        dataTimer = setInterval(() => {
          updateChartData();
        }, 30000); // 30秒更新一次
      });
    });

    // 组件卸载
    onUnmounted(() => {
      // 清除定时器
      if (dataTimer) {
        clearInterval(dataTimer);
      }
      
      // 移除窗口大小变化监听
      window.removeEventListener('resize', handleResize);
      
      // 销毁图表实例
      temperatureChartInstance?.dispose();
      loadGaugeInstance?.dispose();
      voltageChartInstance?.dispose();
      currentChartInstance?.dispose();
      powerFactorChartInstance?.dispose();
      harmonicsChartInstance?.dispose();
    });

    return {
      temperatureChart,
      loadGauge,
      voltageChart,
      currentChart,
      powerFactorChart,
      harmonicsChart,
      transformerStatus,
      runningHours,
      alarmData,
      dateRange,
      refreshData,
      exportData,
      manualInspection,
      checkAllAlarms,
      handleDateChange
    };
  }
};
</script>

<style scoped>
.transformer-monitor {
  width: 100%;
  height: 100%;
  position: relative;
}


/* 状态卡片 */
.status-card {
  position: absolute;
  top: 3px;
  left: 3px;
  height:320px;
  width: 1700px;
  z-index: 10;
}

/* 图表区域布局 */
.temperature-chart {
  top: 490px;
  left: 5px;
  width: 1020px;
  height: 500px;
}

.load-gauge {
  top: 1030px;
  left: 1000px;
  width: 320px;
  height: 300px;
}

.voltage-chart {
  top: 1030px;
  left: 5px;
  width: 950px;
  height: 300px;
}

.current-chart {
  top: 730px;
  left: 1070px;
  width: 600px;
  height: 260px;
}

.power-factor-chart {
  top: 1030px;
  left: 1350px;
  width: 300px;
  height: 300px;
  padding:0;
}

.harmonics-chart {
  top: 150px;
  left: 5px;
  width: 1020px;
  height: 300px;
}

/* 告警面板 */
.alarm-panel {
  position: absolute;
  top: 420px;
  left: 1070px;
  width: 650px;
  z-index: 10;
}

/* 控制面板 */
.control-panel {
  position: absolute;
  top: 150px;
  left: 1065px;
  width: 680px;
  height:400px;
  z-index: 10;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
}


.status-info {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap; /* 允许自动换行 */
  gap: 12px;
  justify-content: space-between; /* 水平分布 */
  align-items: center; /* 垂直对齐 */
}
.status-item {
  display: flex;
  flex-direction: column;
}

.status-item .label {
  font-size: 12px;
  color: #909399;
}

.status-item .value {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
}

.control-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 图表基础样式 */
.chart {
  position: absolute;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  background-color: #ffffff;
  padding: 15px;
}

/* 响应式调整 */
@media (max-width: 1600px) {
  .chart, .status-card, .alarm-panel, .control-panel {
    position: relative;
    width: 100%;
    top: auto !important;
    left: auto !important;
    right: auto !important;
    margin-bottom: 20px;
  }
  
  .transformer-monitor {
    height: auto;
    min-height: auto;
    padding: 10px;
  }
  
  .page-title {
    font-size: 22px;
  }
}

/* 元素UI组件样式增强 */
.el-card {
  border-radius: 8px;
  border: 1px solid #EBEEF5;
}

.el-tag {
  border-radius: 4px;
  font-weight: 500;
}

.el-button {
  transition: all 0.3s ease;
}

.el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.el-table {
  border-radius: 6px;
  overflow: hidden;
}

/* 动画效果 */
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(64, 158, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(64, 158, 255, 0); }
}

.warning-pulse {
  animation: pulse 2s infinite;
}

</style>