<template>
  <div class="dc-screen-monitor">
    <div class="page-header">
      <h2>直流屏监控系统</h2>
      <div class="header-actions">

        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          @change="handleDateChange"
        />
        <el-select v-model="refreshRate" placeholder="刷新频率" @change="handleRefreshRateChange" class="refresh-rate-select">
          <el-option label="5秒" :value="5" />
          <el-option label="10秒" :value="10" />
          <el-option label="30秒" :value="30" />
          <el-option label="60秒" :value="60" />
        </el-select>
    
        <el-button type="primary" @click="refreshData">刷新数据</el-button>
      </div>
    </div>
    
    <!-- 系统状态总览卡片 -->
    <div id="status-card-wrapper" class="status-card">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <span>系统状态</span>
            <el-tag :type="systemStatus.statusType">{{ systemStatus.statusText }}</el-tag>
          </div>
        </template>
        <div class="status-info">
          <div class="status-item">
            <span>通讯状态:</span>
            <el-tag :type="systemStatus.communication ? 'success' : 'danger'">
              {{ systemStatus.communication ? '正常' : '异常' }}
            </el-tag>
          </div>
          <div class="status-item">
            <span>运行模式:</span>
            <span>{{ systemStatus.mode }}</span>
          </div>
          <div class="status-item">
            <span>直流屏设备数:</span>
            <span>{{ systemStatus.deviceCount }}</span>
          </div>
          <div class="status-item">
            <span>告警数:</span>
            <span class="warning-text">{{ systemStatus.alarmCount }}</span>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- 电压监测图表 -->
    <div id="voltage-chart-wrapper" class="chart-container">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <span>电压监测</span>
            <el-select v-model="voltageChartOption" placeholder="查看选项" size="small" style="width: 120px;">
              <el-option label="实时数据" value="realtime" />
              <el-option label="历史趋势" value="history" />
            </el-select>
          </div>
        </template>
        <div id="voltage-chart" ref="voltageChart" class="chart-item chart"></div>
      </el-card>
    </div>
    
    <!-- 电流监测图表 -->
    <div id="current-chart-wrapper" class="chart-container">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <span>电流监测</span>
            <el-select v-model="currentChartOption" placeholder="查看选项" size="small" style="width: 120px;">
              <el-option label="实时数据" value="realtime" />
              <el-option label="负载分布" value="distribution" />
            </el-select>
          </div>
        </template>
        <div id="current-chart" ref="currentChart" class="chart-item chart"></div>
      </el-card>
    </div>
    
    <!-- 电池组状态监测 -->
    <div id="battery-status-chart-wrapper" class="chart-container">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <span>电池组状态</span>
          </div>
        </template>
        <div id="battery-status-chart" ref="batteryStatusChart" class="chart-item chart"></div>
      </el-card>
    </div>
    
    <!-- 温度监测图表 -->
    <div id="temperature-chart-wrapper" class="chart-container">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <span>温度监测</span>
            <el-tooltip content="实时温度监测数据，红线为告警阈值" placement="top">
              <el-icon><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <div id="temperature-chart" ref="temperatureChart" class="chart-item chart"></div>
      </el-card>
    </div>
    
    <!-- 告警统计图表 -->
    <div id="alarm-chart-wrapper" class="chart-container">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <span>告警统计</span>
            <el-button type="text" @click="handleViewAllAlarms">查看全部</el-button>
          </div>
        </template>
        <div id="alarm-chart" ref="alarmChart" class="chart-item chart"></div>
      </el-card>
    </div>
    
    <!-- 直流屏设备列表 -->
    <div id="device-list-wrapper" class="device-list-container">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <span>设备列表</span>
            <el-button type="text" @click="handleRefreshDevices">刷新</el-button>
          </div>
        </template>
        <el-scrollbar height="250px">
          <el-table :data="deviceList" style="width: 100%" size="small" :border="true">
            <el-table-column prop="name" label="设备名称" width="120" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="scope">
                <el-tag :type="scope.row.status === '正常' ? 'success' : 'danger'" size="small">
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="voltage" label="电压" width="70" />
          </el-table>
        </el-scrollbar>
      </el-card>
    </div>
    
    <!-- 最近告警信息 -->
    <div id="alarm-list-wrapper" class="alarm-list-container">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <span>最近告警</span>
            <div>
              <el-select v-model="alarmFilter" placeholder="筛选" size="small" style="width: 100px; margin-right: 10px;">
                <el-option label="全部" value="all" />
                <el-option label="严重" value="serious" />
                <el-option label="警告" value="warning" />
              </el-select>
              <el-button type="primary" size="small" @click="handleExportAlarms">导出</el-button>
            </div>
          </div>
        </template>
        <el-table :data="filteredAlarmList" style="width: 100%" size="small" :border="true">
          <el-table-column prop="time" label="时间" width="180" />
          <el-table-column prop="device" label="设备" width="120" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.type === '严重' ? 'danger' : 'warning'" size="small">
                {{ scope.row.type }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="message" label="告警信息" />
          <el-table-column label="操作" width="100">
            <template #default="scope">
              <el-button type="text" size="small" @click="handleProcessAlarm(scope.row)">处理</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, reactive, onMounted, onBeforeUnmount, computed, nextTick } from 'vue';
import * as echarts from 'echarts';
import { QuestionFilled } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

export default defineComponent({
  name: 'DCScreenMonitor',
  components: {
    QuestionFilled
  },
  setup() {
    // 图表实例对象
    const voltageChart = ref(null);
    const currentChart = ref(null);
    const batteryStatusChart = ref(null);
    const temperatureChart = ref(null);
    const alarmChart = ref(null);

    // 图表对象实例引用
    let voltageChartInstance = null;
    let currentChartInstance = null;
    let batteryStatusChartInstance = null;
    let temperatureChartInstance = null;
    let alarmChartInstance = null;

    // 日期选择和刷新频率
    const dateRange = ref([
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    ]);
    const refreshRate = ref(10); // 默认10秒刷新一次
    let refreshTimer = null;

    // 图表选项
    const voltageChartOption = ref('realtime');
    const currentChartOption = ref('realtime');
    const alarmFilter = ref('all');

    // 系统状态数据
    const systemStatus = reactive({
      statusText: '运行中',
      statusType: 'success',
      communication: true,
      mode: '自动模式',
      deviceCount: 12,
      alarmCount: 3
    });

    // 设备列表数据
    const deviceList = ref([
      { name: 'DC屏-01', status: '正常', voltage: '220V' },
      { name: 'DC屏-02', status: '正常', voltage: '220V' },
      { name: 'DC屏-03', status: '异常', voltage: '210V' },
      { name: 'DC屏-04', status: '正常', voltage: '220V' },
      { name: 'DC屏-05', status: '正常', voltage: '220V' },
      { name: 'DC屏-06', status: '正常', voltage: '220V' },
      { name: 'DC屏-07', status: '正常', voltage: '220V' },
      { name: 'DC屏-08', status: '正常', voltage: '220V' },
      { name: 'DC屏-09', status: '离线', voltage: '0V' },
      { name: 'DC屏-10', status: '正常', voltage: '220V' },
      { name: 'DC屏-11', status: '正常', voltage: '220V' },
      { name: 'DC屏-12', status: '正常', voltage: '220V' }
    ]);

    // 告警列表数据
    const alarmList = ref([
      { time: '2025-06-01 14:23:15', device: 'DC屏-03', type: '警告', message: '电池组温度偏高' },
      { time: '2025-06-01 13:45:32', device: 'DC屏-09', type: '严重', message: '通讯中断' },
      { time: '2025-06-01 12:30:18', device: 'DC屏-03', type: '警告', message: '输出电流波动' },
      { time: '2025-06-01 10:15:22', device: 'DC屏-07', type: '警告', message: '电池组温度偏高' },
      { time: '2025-05-31 23:58:41', device: 'DC屏-05', type: '严重', message: '输出电压低于阈值' }
    ]);

    // 根据筛选条件过滤告警列表
    const filteredAlarmList = computed(() => {
      if (alarmFilter.value === 'all') {
        return alarmList.value;
      }
      return alarmList.value.filter(item => 
        (alarmFilter.value === 'serious' && item.type === '严重') || 
        (alarmFilter.value === 'warning' && item.type === '警告')
      );
    });

    // 模拟数据生成函数
    const generateVoltageData = () => {
      const now = new Date();
      const times = [];
      const values = [];
      
      for (let i = 0; i < 24; i++) {
        const time = new Date(now.getTime() - (23 - i) * 3600 * 1000);
        times.push(time.getHours() + ':00');
        
        // 电压在220V附近波动
        let value = 220 + Math.sin(i * 0.5) * 10 + Math.random() * 5;
        values.push(value.toFixed(1));
      }
      
      return { times, values };
    };
    
    const generateCurrentData = () => {
      const devices = ['DC屏-01', 'DC屏-02', 'DC屏-03', 'DC屏-04', 'DC屏-05'];
      return devices.map(device => ({
        name: device,
        value: Math.floor(10 + Math.random() * 40)
      }));
    };
    
    const generateBatteryStatusData = () => [
      { value: 70, name: '正常' },
      { value: 20, name: '老化' },
      { value: 8, name: '警告' },
      { value: 2, name: '故障' }
    ];
    
    const generateTemperatureData = () => {
      const now = new Date();
      const times = [];
      const values = [];
      const outsideTemps = [];
      
      for (let i = 0; i < 24; i++) {
        const time = new Date(now.getTime() - (23 - i) * 3600 * 1000);
        times.push(time.getHours() + ':00');
        
        // 内部温度在25°C附近波动
        values.push((25 + Math.sin(i * 0.5) * 3 + Math.random() * 2).toFixed(1));
        
        // 外部温度在20°C附近波动
        outsideTemps.push((20 + Math.sin(i * 0.5) * 5 + Math.random() * 3).toFixed(1));
      }
      
      return { times, values, outsideTemps };
    };
    
    const generateAlarmData = () => [
      { value: 8, name: '电压异常' },
      { value: 12, name: '电流异常' },
      { value: 15, name: '温度异常' },
      { value: 5, name: '通讯中断' },
      { value: 2, name: '硬件故障' }
    ];

    // 初始化电压监测图表
    const initVoltageChart = () => {
      if (voltageChartInstance) {
        voltageChartInstance.dispose();
      }
      
      const chartDom = voltageChart.value;
      voltageChartInstance = echarts.init(chartDom);
      
      const { times, values } = generateVoltageData();
      
      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: function(params) {
            return params[0].name + '<br/>' + 
                   params[0].seriesName + ': ' + params[0].value + 'V';
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: times,
          axisLabel: {
            rotate: 30
          }
        },
        yAxis: {
          type: 'value',
          name: '电压 (V)',
          min: 190,
          max: 250,
          axisLabel: {
            formatter: '{value}V'
          }
        },
        series: [{
          name: '电压',
          type: 'line',
          data: values,
          markLine: {
            silent: true,
            lineStyle: {
              color: '#FF4500'
            },
            data: [
              {
                yAxis: 200,
                name: '下限阈值'
              },
              {
                yAxis: 240,
                name: '上限阈值'
              }
            ]
          },
          lineStyle: {
            width: 3,
            color: '#5470c6'
          },
          smooth: true,
          showSymbol: false,
          areaStyle: {
            opacity: 0.3,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: 'rgba(84,112,198,0.5)'
              },
              {
                offset: 1,
                color: 'rgba(84,112,198,0.1)'
              }
            ])
          }
        }]
      };
      
      voltageChartInstance.setOption(option);
    };
    
    // 初始化电流监测图表
    const initCurrentChart = () => {
      if (currentChartInstance) {
        currentChartInstance.dispose();
      }
      
      const chartDom = currentChart.value;
      currentChartInstance = echarts.init(chartDom);
      
      const currentData = generateCurrentData();
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: currentData.map(item => item.name),
          axisLabel: {
            rotate: 30
          }
        },
        yAxis: {
          type: 'value',
          name: '电流 (A)'
        },
        series: [{
          name: '电流',
          type: 'bar',
          data: currentData.map(item => item.value),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' }
            ])
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#2378f7' },
                { offset: 0.7, color: '#2378f7' },
                { offset: 1, color: '#83bff6' }
              ])
            }
          }
        }]
      };
      
      currentChartInstance.setOption(option);
    };
    
    // 初始化电池状态图表
    const initBatteryStatusChart = () => {
      if (batteryStatusChartInstance) {
        batteryStatusChartInstance.dispose();
      }
      
      const chartDom = batteryStatusChart.value;
      batteryStatusChartInstance = echarts.init(chartDom);
      
      const batteryData = generateBatteryStatusData();
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          data: batteryData.map(item => item.name)
        },
        series: [
          {
            name: '电池状态',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: batteryData,
            color: ['#91cc75', '#fac858', '#ee6666', '#73c0de']
          }
        ]
      };
      
      batteryStatusChartInstance.setOption(option);
    };
    
    // 初始化温度监测图表
    const initTemperatureChart = () => {
      if (temperatureChartInstance) {
        temperatureChartInstance.dispose();
      }
      
      const chartDom = temperatureChart.value;
      temperatureChartInstance = echarts.init(chartDom);
      
      const { times, values, outsideTemps } = generateTemperatureData();
      
      const option = {
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
          data: ['内部温度', '环境温度'],
          top: 10
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: times,
          axisLabel: {
            rotate: 30
          }
        },
        yAxis: {
          type: 'value',
          name: '温度 (°C)',
          axisLabel: {
            formatter: '{value}°C'
          }
        },
        series: [
          {
            name: '内部温度',
            type: 'line',
            smooth: true,
            lineStyle: {
              width: 3,
              color: '#FF7F50'
            },
            data: values,
            markLine: {
              silent: true,
              data: [
                {
                  yAxis: 30,
                  name: '告警阈值',
                  lineStyle: {
                    color: '#FF4500'
                  }
                }
              ]
            }
          },
          {
            name: '环境温度',
            type: 'line',
            smooth: true,
            lineStyle: {
              width: 3,
              color: '#87CEEB'
            },
            data: outsideTemps
          }
        ]
      };
      
      temperatureChartInstance.setOption(option);
    };
    
    // 初始化告警统计图表
    const initAlarmChart = () => {
      if (alarmChartInstance) {
        alarmChartInstance.dispose();
      }
      
      const chartDom = alarmChart.value;
      alarmChartInstance = echarts.init(chartDom);
      
      const alarmData = generateAlarmData();
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          show: false
        },
        series: [
          {
            name: '告警类型',
            type: 'pie',
            radius: '70%',
            center: ['50%', '50%'],
            data: alarmData,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            label: {
              formatter: '{b}: {c}\n({d}%)'
            }
          }
        ],
        color: ['#ee6666', '#fac858', '#91cc75', '#5470c6', '#73c0de']
      };
      
      alarmChartInstance.setOption(option);
    };

    // 更新图表数据
    const updateCharts = () => {
      if (voltageChartInstance) {
        const { times, values } = generateVoltageData();
        voltageChartInstance.setOption({
          xAxis: { data: times },
          series: [{ data: values }]
        });
      }

      if (currentChartInstance) {
        const currentData = generateCurrentData();
        currentChartInstance.setOption({
          xAxis: { data: currentData.map(item => item.name) },
          series: [{ data: currentData.map(item => item.value) }]
        });
      }

      if (temperatureChartInstance) {
        const { times, values, outsideTemps } = generateTemperatureData();
        temperatureChartInstance.setOption({
          xAxis: { data: times },
          series: [
            { data: values },
            { data: outsideTemps }
          ]
        });
      }

      // 更新系统状态数据
      systemStatus.alarmCount = Math.floor(Math.random() * 5);
      // 随机模拟通讯状态
      if (Math.random() > 0.95) {
        systemStatus.communication = !systemStatus.communication;
        systemStatus.statusText = systemStatus.communication ? '运行中' : '通讯异常';
        systemStatus.statusType = systemStatus.communication ? 'success' : 'danger';
      }
    };

    // 处理日期范围变化
    const handleDateChange = (val) => {
      if (val) {
        // 日期变化重新加载数据
        refreshData();
      }
    };

    // 处理刷新频率变化
    const handleRefreshRateChange = (val) => {
      clearInterval(refreshTimer);
      refreshTimer = setInterval(() => {
        updateCharts();
      }, val * 1000);
    };

    // 刷新数据
    const refreshData = () => {
      ElMessage.success('数据已刷新');
      updateCharts();
    };

    // 查看所有告警
    const handleViewAllAlarms = () => {
      ElMessageBox.alert('跳转到告警管理页面', '查看全部告警', {
        confirmButtonText: '确定'
      });
    };

    // 刷新设备列表
    const handleRefreshDevices = () => {
      ElMessage.success('设备列表已刷新');
      // 模拟更新一些设备状态
      deviceList.value = deviceList.value.map(device => {
        if (Math.random() > 0.8) {
          return {
            ...device,
            status: Math.random() > 0.7 ? '正常' : '异常',
            voltage: (210 + Math.random() * 20).toFixed(0) + 'V'
          };
        }
        return device;
      });
    };

    // 导出告警
    const handleExportAlarms = () => {
      ElMessage.success('告警数据已导出');
    };

    // 处理告警
    const handleProcessAlarm = (alarm) => {
      ElMessageBox.confirm(`确认处理告警: "${alarm.message}"?`, '处理告警', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        ElMessage({
          type: 'success',
          message: '告警已处理'
        });
        // 从列表中移除该告警
        alarmList.value = alarmList.value.filter(item => item !== alarm);
      }).catch(() => {});
    };

    // 组件挂载
    onMounted(() => {
      nextTick(() => {
        initVoltageChart();
        initCurrentChart();
        initBatteryStatusChart();
        initTemperatureChart();
        initAlarmChart();
        
        // 启动定时刷新
        refreshTimer = setInterval(() => {
          updateCharts();
        }, refreshRate.value * 1000);
        
        // 窗口大小调整时重绘图表
        window.addEventListener('resize', () => {
          voltageChartInstance?.resize();
          currentChartInstance?.resize();
          batteryStatusChartInstance?.resize();
          temperatureChartInstance?.resize();
          alarmChartInstance?.resize();
        });
      });
    });
    
    // 组件卸载前清理
    onBeforeUnmount(() => {
      clearInterval(refreshTimer);
      voltageChartInstance?.dispose();
      currentChartInstance?.dispose();
      batteryStatusChartInstance?.dispose();
      temperatureChartInstance?.dispose();
      alarmChartInstance?.dispose();
      window.removeEventListener('resize', () => {});
    });

    // 输出到模板
    return {
      // refs
      voltageChart,
      currentChart,
      batteryStatusChart,
      temperatureChart,
      alarmChart,
      // data
      dateRange,
      refreshRate,
      voltageChartOption,
      currentChartOption,
      systemStatus,
      deviceList,
      alarmList,
      filteredAlarmList,
      alarmFilter,
      // methods
      handleDateChange,
      handleRefreshRateChange,
      refreshData,
      handleViewAllAlarms,
      handleRefreshDevices,
      handleExportAlarms,
      handleProcessAlarm
    };
  }
});
</script>

<style scoped>
.dc-screen-monitor {
  position: relative;
  width: 1200px;
  height: 100%;
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 950px;
}

.page-header {
  display: flex;
  align-items: left;
  margin-bottom: 2px;
  gap:50px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center; /* 确保内部元素也垂直居中 */
  gap: 15px; /* 可以调整为您想要的间距，例如 15px */
  margin-left: auto;
}

.refresh-rate-select {
  width: 120px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart {
  width: 100%;
  height: 220px;
}

.chart-item {
  /* This class is for easier selection of all chart divs. */
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-item {
  display: flex;
  justify-content: space-between;
}

.warning-text {
  color: #e6a23c;
  font-weight: bold;
}

.device-list-container .el-table {
  max-height: 250px;
}

/* Page Layout Styling */
#status-card-wrapper {
  position: absolute;
  top: 80px;
  left: 20px;
  width: 300px;
  height: 180px;
}

#voltage-chart-wrapper {
  position: absolute;
  top: 80px;
  left: 328px;
  width: 880px;
  height: 390px;
}

#current-chart-wrapper {
  position: absolute;
  top: 800px;
  right: 20px;
  width: 320px;
  height: 300px;
}

#battery-status-chart-wrapper {
  position: absolute;
  top: 280px;
  left: 20px;
  width: 300px;
  height: 280px;
}

#temperature-chart-wrapper {
  position: absolute;
  top: 400px;
  left: 340px;
  width: calc(100% - 700px);
  height: 280px;
}

#alarm-chart-wrapper {
  position: absolute;
  top: 400px;
  right: 20px;
  width: 320px;
  height: 280px;
}

#device-list-wrapper {
  position: absolute;
  top: 580px;
  left: 20px;
  width: 300px;
  height: 320px;
}

#alarm-list-wrapper {
  position: absolute;
  top: 700px;
  left: 340px;
  width: calc(100% - 360px);
  height: 200px;
}

/* Ensure absolutely positioned elements do not overflow */
.chart-container, .status-card, .device-list-container, .alarm-list-container {
  overflow: hidden;
}
</style>