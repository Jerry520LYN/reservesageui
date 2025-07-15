<template>
  <div class="electric-meter-monitor">
    <div class="electric-meter-header">
      <h2>电表监测系统</h2>
      <div class="time-filter">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :shortcuts="dateShortcuts"
          @change="handleDateChange"
        />
        <el-select v-model="refreshInterval" placeholder="刷新间隔" @change="setRefreshInterval">
          <el-option label="5秒" :value="5" />
          <el-option label="10秒" :value="10" />
          <el-option label="30秒" :value="30" />
          <el-option label="1分钟" :value="60" />
        </el-select>
        <el-button type="primary" @click="refreshData">刷新数据</el-button>
      </div>
    </div>

    <!-- 电表总览卡片 -->
    <div class="overview-cards" style="position: absolute; top: 80px; left: 20px; right: 20px; height: 100px;">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="card-content">
              <div class="card-icon electricity">
                <i class="el-icon-lightning" />
              </div>
              <div class="card-info">
                <div class="card-title">总用电量</div>
                <div class="card-value">{{ totalConsumption }} kWh</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="card-content">
              <div class="card-icon power">
                <i class="el-icon-cpu" />
              </div>
              <div class="card-info">
                <div class="card-title">当前功率</div>
                <div class="card-value">{{ currentPower }} kW</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="card-content">
              <div class="card-icon voltage">
                <i class="el-icon-odometer" />
              </div>
              <div class="card-info">
                <div class="card-title">平均电压</div>
                <div class="card-value">{{ averageVoltage }} V</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="card-content">
              <div class="card-icon alarm">
                <i class="el-icon-warning" />
              </div>
              <div class="card-info">
                <div class="card-title">告警数量</div>
                <div class="card-value">{{ alarmCount }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 电压电流实时曲线图 -->
    <div class="chart voltage-current-chart" 
         style="position: absolute; top: 200px; left: 20px; width: 60%; height: 300px;">
      <el-card shadow="hover" body-style="height: 100%; padding: 0;">
        <template #header>
          <div class="chart-header">
            <span>电压电流实时曲线</span>
            <el-radio-group v-model="voltageCurrentChartType" >
              <el-radio-button label="realtime">实时</el-radio-button>
              <el-radio-button label="history">历史</el-radio-button>
            </el-radio-group>
          </div>
        </template>
        <div ref="voltageCurrentChart" style="height: 100%; width: 100%;"></div>
      </el-card>
    </div>

    <!-- 功率趋势图 -->
    <div class="chart power-trend-chart" 
         style="position: absolute; top: 200px; right: 20px; width: 38%; height: 300px;">
      <el-card shadow="hover" body-style="height: 100%; padding: 0;">
        <template #header>
          <div class="chart-header">
            <span>功率趋势</span>
            <el-select v-model="powerTrendTimespan" size="small" style="width: 120px;">
              <el-option label="近24小时" value="24h" />
              <el-option label="近7天" value="7d" />
              <el-option label="近30天" value="30d" />
            </el-select>
          </div>
        </template>
        <div ref="powerTrendChart" style="height: 100%; width: 100%;"></div>
      </el-card>
    </div>

    <!-- 电能消耗分布 -->
    <div class="chart energy-consumption-chart" 
         style="position: absolute; top: 520px; left: 20px; width: 30%; height: 300px;">
      <el-card shadow="hover" body-style="height: 100%; padding: 0;">
        <template #header>
          <div class="chart-header">
            <span>电能消耗分布</span>
            <el-select v-model="energyConsumptionType" size="small" style="width: 120px;">
              <el-option label="按时间段" value="timeSlot" />
              <el-option label="按设备类型" value="deviceType" />
            </el-select>
          </div>
        </template>
        <div ref="energyConsumptionChart" style="height: 100%; width: 100%;"></div>
      </el-card>
    </div>

    <!-- 用电负荷热力图 -->
    <div class="chart load-heatmap-chart" 
         style="position: absolute; top: 520px; left: calc(30% + 30px); width: 30%; height: 300px;">
      <el-card shadow="hover" body-style="height: 100%; padding: 0;">
        <template #header>
          <div class="chart-header">
            <span>用电负荷热力图</span>
            <el-dropdown size="small" trigger="click">
              <span class="el-dropdown-link">
                {{ heatmapTimeRange }}<i class="el-icon-arrow-down el-icon--right"></i>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="heatmapTimeRange = '近7天'">近7天</el-dropdown-item>
                  <el-dropdown-item @click="heatmapTimeRange = '近30天'">近30天</el-dropdown-item>
                  <el-dropdown-item @click="heatmapTimeRange = '近90天'">近90天</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
        <div ref="loadHeatmapChart" style="height: 100%; width: 100%;"></div>
      </el-card>
    </div>

    <!-- 相位分析图 -->
    <div class="chart phase-analysis-chart" 
         style="position: absolute; top: 520px; right: 20px; width: calc(40% - 30px); height: 300px;">
      <el-card shadow="hover" body-style="height: 100%; padding: 0;">
        <template #header>
          <div class="chart-header">
            <span>三相电参数分析</span>
            <el-switch v-model="showThreePhase" active-text="三相" inactive-text="单相" />
          </div>
        </template>
        <div ref="phaseAnalysisChart" style="height: 100%; width: 100%;"></div>
      </el-card>
    </div>

    <!-- 电表告警记录表格 -->
    <div class="alarm-table" 
         style="position: absolute; top: 840px; left: 20px; right: 20px; height: 300px;">
      <el-card shadow="hover" body-style="height: 100%; padding: 10px;">
        <template #header>
          <div class="chart-header">
            <span>电表告警记录</span>
            <div>
              <el-input v-model="alarmSearchQuery" placeholder="搜索告警信息" style="width: 200px;" />
              <el-button type="primary" size="small" @click="exportAlarmData">导出</el-button>
            </div>
          </div>
        </template>
        <el-table :data="filteredAlarmData" height="calc(100% - 20px)" style="width: 100%">
          <el-table-column prop="time" label="时间" width="180" />
          <el-table-column prop="meterID" label="电表ID" width="120" />
          <el-table-column prop="type" label="告警类型" width="150" />
          <el-table-column prop="value" label="告警值" width="120" />
          <el-table-column prop="threshold" label="阈值" width="120" />
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" />
          <el-table-column fixed="right" label="操作" width="100">
            <template #default="scope">
              <el-button link type="primary" size="small" @click="handleAlarmDetail(scope.row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, nextTick, reactive } from 'vue';
import * as echarts from 'echarts';
import { ElMessage } from 'element-plus';

export default {
  name: 'ElectricMeterMonitor',
  setup() {
    // 引用DOM元素
    const voltageCurrentChart = ref(null);
    const powerTrendChart = ref(null);
    const energyConsumptionChart = ref(null);
    const loadHeatmapChart = ref(null);
    const phaseAnalysisChart = ref(null);

    // echarts实例
    const chartInstances = reactive({
      voltageCurrentChart: null,
      powerTrendChart: null,
      energyConsumptionChart: null,
      loadHeatmapChart: null,
      phaseAnalysisChart: null
    });

    // 数据筛选和刷新
    const dateRange = ref([new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()]);
    const refreshInterval = ref(30);
    let refreshTimer = null;

    // 图表配置选项
    const voltageCurrentChartType = ref('realtime');
    const powerTrendTimespan = ref('24h');
    const energyConsumptionType = ref('timeSlot');
    const heatmapTimeRange = ref('近7天');
    const showThreePhase = ref(true);
    const alarmSearchQuery = ref('');

    // 监控数据
    const totalConsumption = ref('127,845.62');
    const currentPower = ref('78.5');
    const averageVoltage = ref('220.3');
    const alarmCount = ref(12);

    // 告警数据
    const alarmData = ref([
      {
        time: '2025-06-01 10:15:23',
        meterID: 'EM-001',
        type: '过压告警',
        value: '253.6 V',
        threshold: '250 V',
        status: '已处理',
        description: '电网电压过高，已触发保护'
      },
      {
        time: '2025-06-01 09:32:17',
        meterID: 'EM-003',
        type: '过流告警',
        value: '65.2 A',
        threshold: '60 A',
        status: '已处理',
        description: '线路负载过高，已降低功率'
      },
      {
        time: '2025-06-01 08:45:09',
        meterID: 'EM-002',
        type: '功率因数异常',
        value: '0.72',
        threshold: '0.85',
        status: '未处理',
        description: '功率因数过低，需检查感性负载'
      },
      {
        time: '2025-06-01 07:12:56',
        meterID: 'EM-001',
        type: '谐波超标',
        value: '8.7%',
        threshold: '5%',
        status: '处理中',
        description: '电网谐波含量超标，可能影响设备运行'
      },
      {
        time: '2025-05-31 23:45:12',
        meterID: 'EM-004',
        type: '通信中断',
        value: '断开',
        threshold: '连接',
        status: '已恢复',
        description: '电表通信中断，已恢复连接'
      },
      {
        time: '2025-05-31 22:10:33',
        meterID: 'EM-002',
        type: '断相告警',
        value: 'B相断相',
        threshold: '正常',
        status: '已处理',
        description: 'B相断相，已修复'
      },
      {
        time: '2025-05-31 20:25:46',
        meterID: 'EM-005',
        type: '过压告警',
        value: '248.9 V',
        threshold: '245 V',
        status: '已处理',
        description: '电网电压略高，已调整'
      },
      {
        time: '2025-05-31 18:37:22',
        meterID: 'EM-001',
        type: '电流不平衡',
        value: '15.3%',
        threshold: '10%',
        status: '未处理',
        description: '三相电流不平衡，需检查负载分布'
      }
    ]);

    // 日期快捷选项
    const dateShortcuts = [
      {
        text: '最近一周',
        value: () => {
          const end = new Date();
          const start = new Date();
          start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
          return [start, end];
        },
      },
      {
        text: '最近一个月',
        value: () => {
          const end = new Date();
          const start = new Date();
          start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
          return [start, end];
        },
      },
      {
        text: '最近三个月',
        value: () => {
          const end = new Date();
          const start = new Date();
          start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
          return [start, end];
        },
      },
    ];

    // 模拟电压电流数据
    const generateVoltageCurrentData = () => {
      const now = new Date();
      const data = [];
      let baseVoltage = 220;
      let baseCurrent = 10;
      
      for (let i = 0; i < 100; i++) {
        const time = new Date(now.getTime() - (99 - i) * 60 * 1000);
        const voltage = baseVoltage + Math.random() * 10 - 5;
        const current = baseCurrent + Math.random() * 2 - 1;
        
        data.push({
          time: time.toLocaleTimeString(),
          voltage: voltage.toFixed(1),
          current: current.toFixed(1)
        });
        
        // 添加一些波动
        if (i % 20 === 0) {
          baseVoltage = 220 + Math.random() * 6 - 3;
          baseCurrent = 10 + Math.random() * 1 - 0.5;
        }
      }
      
      return data;
    };

    // 模拟功率趋势数据
    const generatePowerTrendData = (timespan) => {
      const now = new Date();
      const data = [];
      let count = 0;
      let interval = 0;
      
      switch (timespan) {
        case '24h':
          count = 24;
          interval = 60 * 60 * 1000; // 1小时
          break;
        case '7d':
          count = 7;
          interval = 24 * 60 * 60 * 1000; // 1天
          break;
        case '30d':
          count = 30;
          interval = 24 * 60 * 60 * 1000; // 1天
          break;
      }
      
      let basePower = 75;
      
      for (let i = 0; i < count; i++) {
        const time = new Date(now.getTime() - (count - 1 - i) * interval);
        const activePower = basePower + Math.random() * 20 - 10;
        const reactivePower = activePower * 0.3 + Math.random() * 5 - 2.5;
        const apparentPower = Math.sqrt(Math.pow(activePower, 2) + Math.pow(reactivePower, 2));
        
        let label = '';
        if (timespan === '24h') {
          label = time.getHours() + ':00';
        } else {
          label = `${time.getMonth() + 1}/${time.getDate()}`;
        }
        
        data.push({
          time: label,
          activePower: activePower.toFixed(1),
          reactivePower: reactivePower.toFixed(1),
          apparentPower: apparentPower.toFixed(1)
        });
        
        // 添加一些波动
        if (i % 5 === 0) {
          basePower = 75 + Math.random() * 15 - 7.5;
        }
      }
      
      return data;
    };

    // 模拟电能消耗分布数据
    const generateEnergyConsumptionData = (type) => {
      if (type === 'timeSlot') {
        return [
          { name: '0:00-6:00', value: 12.5 },
          { name: '6:00-12:00', value: 28.7 },
          { name: '12:00-18:00', value: 35.2 },
          { name: '18:00-24:00', value: 23.6 }
        ];
      } else {
        return [
          { name: '照明系统', value: 15.8 },
          { name: '空调系统', value: 42.3 },
          { name: '动力设备', value: 27.5 },
          { name: '办公设备', value: 9.7 },
          { name: '其他用电', value: 4.7 }
        ];
      }
    };

    // 模拟用电负荷热力图数据
    const generateLoadHeatmapData = (timeRange) => {
      const days = timeRange === '近7天' ? 7 : timeRange === '近30天' ? 30 : 90;
      const hours = 24;
      const data = [];
      
      for (let d = 0; d < days; d++) {
        for (let h = 0; h < hours; h++) {
          // 工作日和工作时间负荷较高
          let baseLoad = 30;
          const dayOfWeek = (d % 7);
          const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // 周六日
          const isWorkHour = h >= 8 && h < 18;
          
          if (isWorkHour && !isWeekend) {
            baseLoad = 70;
          } else if (isWorkHour && isWeekend) {
            baseLoad = 50;
          } else if (!isWorkHour && (h >= 18 && h < 22)) {
            baseLoad = 55; // 晚上时段
          }
          
          const value = baseLoad + Math.random() * 20 - 10;
          
          data.push([d, h, Math.round(value)]);
        }
      }
      
      return {
        days: Array.from({ length: days }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - days + i + 1);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }),
        hours: Array.from({ length: hours }, (_, i) => `${i}:00`),
        data: data
      };
    };

    // 模拟三相电参数数据
    const generatePhaseAnalysisData = (showThreePhase) => {
      if (showThreePhase) {
        return {
          phases: ['A相', 'B相', 'C相'],
          voltage: [218.5, 221.2, 219.7],
          current: [10.2, 9.8, 10.5],
          activePower: [2230, 2170, 2310],
          powerFactor: [0.92, 0.93, 0.91],
          frequency: [49.97, 49.98, 49.96]
        };
      } else {
        return {
          phases: ['单相'],
          voltage: [220.5],
          current: [9.9],
          activePower: [2180],
          powerFactor: [0.92],
          frequency: [50.02]
        };
      }
    };

    // 绘制电压电流实时曲线图
    const drawVoltageCurrentChart = () => {
      if (!chartInstances.voltageCurrentChart) {
        chartInstances.voltageCurrentChart = echarts.init(voltageCurrentChart.value);
      }
      
      const data = generateVoltageCurrentData();
      const option = {
        title: {
          text: '',
          left: 'center'
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
          top: '10'
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
          data: data.map(item => item.time),
          axisLabel: {
            interval: Math.floor(data.length / 10),
            rotate: 30
          }
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
            axisLabel: {
              formatter: '{value} V'
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
            axisLabel: {
              formatter: '{value} A'
            }
          }
        ],
        series: [
          {
            name: '电压',
            type: 'line',
            yAxisIndex: 0,
            data: data.map(item => item.voltage),
            smooth: true,
            lineStyle: {
              width: 2
            },
            markLine: {
              data: [
                {
                  name: '标准电压',
                  yAxis: 220,
                  lineStyle: {
                    type: 'dashed',
                    color: '#5470c6'
                  },
                  label: {
                    formatter: '标准电压: 220V'
                  }
                }
              ]
            }
          },
          {
            name: '电流',
            type: 'line',
            yAxisIndex: 1,
            data: data.map(item => item.current),
            smooth: true,
            lineStyle: {
              width: 2
            }
          }
        ]
      };
      
      chartInstances.voltageCurrentChart.setOption(option);
    };

    // 绘制功率趋势图
    const drawPowerTrendChart = () => {
      if (!chartInstances.powerTrendChart) {
        chartInstances.powerTrendChart = echarts.init(powerTrendChart.value);
      }
      
      const data = generatePowerTrendData(powerTrendTimespan.value);
      const option = {
        title: {
          text: '',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: function (params) {
            let result = params[0].axisValue + '<br/>';
            params.forEach(item => {
              result += item.marker + ' ' + item.seriesName + ': ' + item.value + ' kW<br/>';
            });
            return result;
          }
        },
        legend: {
          data: ['有功功率', '无功功率', '视在功率'],
          top: '10'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: data.map(item => item.time)
        },
        yAxis: {
          type: 'value',
          name: '功率(kW)',
          axisLabel: {
            formatter: '{value} kW'
          }
        },
        series: [
          {
            name: '有功功率',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: data.map(item => item.activePower)
          },
          {
            name: '无功功率',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: data.map(item => item.reactivePower)
          },
          {
            name: '视在功率',
            type: 'line',
            emphasis: {
              focus: 'series'
            },
            data: data.map(item => item.apparentPower),
            lineStyle: {
              width: 3,
              shadowColor: 'rgba(0,0,0,0.3)',
              shadowBlur: 10,
              shadowOffsetY: 8
            },
            itemStyle: {
              color: '#ee6666'
            }
          }
        ]
      };
      
      chartInstances.powerTrendChart.setOption(option);
    };

    // 绘制电能消耗分布图
    const drawEnergyConsumptionChart = () => {
      if (!chartInstances.energyConsumptionChart) {
        chartInstances.energyConsumptionChart = echarts.init(energyConsumptionChart.value);
      }
      
      const data = generateEnergyConsumptionData(energyConsumptionType.value);
      const option = {
        title: {
          text: '',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} kWh ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          top: 'middle',
          data: data.map(item => item.name)
        },
        series: [
          {
            name: '电能消耗',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              formatter: '{b}: {d}%'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '16',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: true
            },
            data: data
          }
        ]
      };
      
      chartInstances.energyConsumptionChart.setOption(option);
    };

    // 绘制用电负荷热力图
    const drawLoadHeatmapChart = () => {
      if (!chartInstances.loadHeatmapChart) {
        chartInstances.loadHeatmapChart = echarts.init(loadHeatmapChart.value);
      }
      
      const { days, hours, data } = generateLoadHeatmapData(heatmapTimeRange.value);
      const option = {
        title: {
          text: '',
          left: 'center'
        },
        tooltip: {
          position: 'top',
          formatter: function (params) {
            return `${days[params.data[0]]} ${hours[params.data[1]]}<br>负荷: ${params.data[2]} kW`;
          }
        },
        grid: {
          top: '10%',
          bottom: '10%',
          left: '10%',
          right: '15%'
        },
        xAxis: {
          type: 'category',
          data: hours,
          splitArea: {
            show: true
          },
          axisLabel: {
            interval: 3
          }
        },
        yAxis: {
          type: 'category',
          data: days,
          splitArea: {
            show: true
          },
          axisLabel: {
            interval: Math.max(1, Math.floor(days.length / 10))
          }
        },
        visualMap: {
          min: 0,
          max: 100,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '0%',
          text: ['高', '低'],
          inRange: {
            color: ['#d5f5f9', '#65b7f3', '#0071ce', '#002c71']
          }
        },
        series: [{
          name: '用电负荷',
          type: 'heatmap',
          data: data,
          label: {
            show: false
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      };
      
      chartInstances.loadHeatmapChart.setOption(option);
    };

    // 绘制三相电参数分析图
    const drawPhaseAnalysisChart = () => {
      if (!chartInstances.phaseAnalysisChart) {
        chartInstances.phaseAnalysisChart = echarts.init(phaseAnalysisChart.value);
      }
      
      const phaseData = generatePhaseAnalysisData(showThreePhase.value);
      
      const option = {
        title: {
          text: '',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: ['电压(V)', '电流(A)', '功率因数']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: [
          {
            type: 'category',
            data: phaseData.phases,
            axisPointer: {
              type: 'shadow'
            }
          }
        ],
        yAxis: [
          {
            type: 'value',
            name: '电压(V)',
            axisLabel: {
              formatter: '{value} V'
            }
          },
          {
            type: 'value',
            name: '电流(A)',
            axisLabel: {
              formatter: '{value} A'
            }
          }
        ],
        series: [
          {
            name: '电压(V)',
            type: 'bar',
            data: phaseData.voltage
          },
          {
            name: '电流(A)',
            type: 'bar',
            yAxisIndex: 1,
            data: phaseData.current
          },
          {
            name: '功率因数',
            type: 'line',
            yAxisIndex: 1,
            data: phaseData.powerFactor,
            symbol: 'triangle',
            symbolSize: 10,
            lineStyle: {
              width: 4,
              type: 'dotted'
            },
            itemStyle: {
              color: '#91cc75'
            }
          }
        ]
      };
      
      chartInstances.phaseAnalysisChart.setOption(option);
    };

    // 告警数据过滤
    const filteredAlarmData = computed(() => {
      if (!alarmSearchQuery.value) {
        return alarmData.value;
      }
      
      const query = alarmSearchQuery.value.toLowerCase();
      return alarmData.value.filter(item => {
        return Object.values(item).some(val => {
          if (typeof val === 'string') {
            return val.toLowerCase().includes(query);
          }
          return false;
        });
      });
    });

    // 获取告警状态类型
    const getStatusType = (status) => {
      switch (status) {
        case '未处理':
          return 'danger';
        case '处理中':
          return 'warning';
        case '已处理':
          return 'success';
        case '已恢复':
          return 'info';
        default:
          return '';
      }
    };

    // 处理告警详情点击
    const handleAlarmDetail = (row) => {
      ElMessage({
        message: `查看告警详情: ${row.meterID} - ${row.type}`,
        type: 'info'
      });
    };

    // 导出告警数据
    const exportAlarmData = () => {
      ElMessage({
        message: '告警数据已导出到本地',
        type: 'success'
      });
    };

    // 处理日期变更
    const handleDateChange = () => {
      refreshData();
    };

    // 设置刷新间隔
    const setRefreshInterval = (interval) => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
      
      if (interval > 0) {
        refreshTimer = setInterval(() => {
          refreshData();
        }, interval * 1000);
      }
    };

    // 刷新数据
    const refreshData = () => {
      drawVoltageCurrentChart();
      drawPowerTrendChart();
      drawEnergyConsumptionChart();
      drawLoadHeatmapChart();
      drawPhaseAnalysisChart();
      
      ElMessage({
        message: '数据已刷新',
        type: 'success'
      });
    };

    // 窗口大小变化时重绘图表
    const handleResize = () => {
      for (const key in chartInstances) {
        if (chartInstances[key]) {
          chartInstances[key].resize();
        }
      }
    };

    onMounted(() => {
      // 初次绘制图表
      nextTick(() => {
        drawVoltageCurrentChart();
        drawPowerTrendChart();
        drawEnergyConsumptionChart();
        drawLoadHeatmapChart();
        drawPhaseAnalysisChart();
        
        // 设置默认刷新间隔
        setRefreshInterval(refreshInterval.value);
        
        // 监听窗口大小变化
        window.addEventListener('resize', handleResize);
      });
    });

    onUnmounted(() => {
      // 清除定时器
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
      
      // 移除事件监听
      window.removeEventListener('resize', handleResize);
      
      // 销毁图表实例
      for (const key in chartInstances) {
        if (chartInstances[key]) {
          chartInstances[key].dispose();
        }
      }
    });

    return {
      // 引用
      voltageCurrentChart,
      powerTrendChart,
      energyConsumptionChart,
      loadHeatmapChart,
      phaseAnalysisChart,
      
      // 数据和状态
      dateRange,
      refreshInterval,
      voltageCurrentChartType,
      powerTrendTimespan,
      energyConsumptionType,
      heatmapTimeRange,
      showThreePhase,
      alarmSearchQuery,
      totalConsumption,
      currentPower,
      averageVoltage,
      alarmCount,
      alarmData,
      filteredAlarmData,
      dateShortcuts,
      
      // 方法
      handleDateChange,
      setRefreshInterval,
      refreshData,
      getStatusType,
      handleAlarmDetail,
      exportAlarmData
    };
  }
};
</script>

<style>
.electric-meter-monitor {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 1200px;
  padding: 0px;
}

.electric-meter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

}

.electric-meter-header h2 {
  margin: 0;
  color: #303133;
}

.time-filter {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chart {
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  background-color: #fff;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
}

.card-content {
  display: flex;
  align-items: center;
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 10px;
  color: white;
  font-size: 24px;
}

.card-icon.electricity {
  background-color: #409EFF;
}

.card-icon.power {
  background-color: #67C23A;
}

.card-icon.voltage {
  background-color: #E6A23C;
}

.card-icon.alarm {
  background-color: #F56C6C;
}

.card-info {
  flex: 1;
}

.card-title {
  font-size: 14px;
  color: #909399;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

/* 兼容移动端 */
@media (max-width: 768px) {
  .overview-cards,
  .voltage-current-chart,
  .power-trend-chart,
  .energy-consumption-chart,
  .load-heatmap-chart,
  .phase-analysis-chart,
  .alarm-table {
    position: static !important;
    width: 100% !important;
    margin-bottom: 20px !important;
    height: 350px !important;
  }

  .electric-meter-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .time-filter {
    margin-top: 10px;
    flex-wrap: wrap;
  }
}
</style>