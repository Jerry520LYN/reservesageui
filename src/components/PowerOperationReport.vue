<template>
  <div class="power-operation-report">
    <div class="report-header">
      <h2>电力运行报表</h2>
      <div class="filter-container">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :shortcuts="dateShortcuts"
          @change="handleDateRangeChange"
        />
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon> 刷新数据
        </el-button>
      </div>
    </div>

    <div class="chart-container">
      <!-- 充放电趋势图 -->
      <div class="chart-item" id="charging-chart" ref="chargingChart"></div>
      
      <!-- 电能效率分析图 -->
      <div class="chart-item" id="efficiency-chart" ref="efficiencyChart"></div>
      
      <!-- 能量分配比例图 -->
      <div class="chart-item" id="distribution-chart" ref="distributionChart"></div>
      
      <!-- 异常情况统计图 -->
      <div class="chart-item" id="abnormal-chart" ref="abnormalChart"></div>
      
      <!-- 月度电力统计图 -->
      <div class="chart-item" id="monthly-chart" ref="monthlyChart"></div>
      
      <!-- 实时功率表盘 -->
      <div class="chart-item" id="power-gauge" ref="powerGauge"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { ElDatePicker, ElButton, ElIcon } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import 'element-plus/dist/index.css';

// 图表引用
const chargingChart = ref(null);
const efficiencyChart = ref(null);
const distributionChart = ref(null);
const abnormalChart = ref(null);
const monthlyChart = ref(null);
const powerGauge = ref(null);

// 图表实例
const chartInstances = {
  charging: null,
  efficiency: null,
  distribution: null,
  abnormal: null,
  monthly: null,
  gauge: null
};

// 日期范围
const dateRange = ref([
  new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
  new Date()
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

// 模拟数据生成函数
const generateMockData = () => {
  // 生成时间序列
  const generateTimeData = (days) => {
    const result = [];
    const now = new Date();
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      result.push(`${date.getMonth() + 1}/${date.getDate()}`);
    }
    return result;
  };

  // 生成随机值序列
  const generateRandomData = (count, min, max) => {
    return Array.from({ length: count }, () => 
      Math.floor(Math.random() * (max - min + 1)) + min
    );
  };
  
  const days = 7;
  const timeData = generateTimeData(days);
  
  // 充放电数据
  const chargingData = {
    time: timeData,
    chargePower: generateRandomData(days + 1, 50, 120),
    dischargePower: generateRandomData(days + 1, 40, 100),
    soc: generateRandomData(days + 1, 20, 90)
  };
  
  // 电能效率数据
  const efficiencyData = {
    time: timeData,
    efficiency: generateRandomData(days + 1, 80, 98).map(v => v / 100),
    temperature: generateRandomData(days + 1, 20, 45),
    voltage: generateRandomData(days + 1, 210, 240)
  };
  
  // 能量分配数据
  const distributionData = {
    types: ['峰时放电', '谷时充电', '辅助服务', '备用容量', '自用电量'],
    values: generateRandomData(5, 10, 35)
  };
  
  // 异常情况数据
  const abnormalData = {
    categories: ['过压', '欠压', '过流', '温度异常', '通信中断', '控制异常'],
    counts: generateRandomData(6, 0, 8)
  };
  
  // 月度统计数据
  const monthlyData = {
    months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    generated: generateRandomData(12, 2000, 5000),
    consumed: generateRandomData(12, 1500, 4500),
    efficiency: generateRandomData(12, 85, 95).map(v => v / 100)
  };
  
  return {
    chargingData,
    efficiencyData,
    distributionData,
    abnormalData,
    monthlyData
  };
};

// 初始化图表
const initCharts = () => {
  // 初始化各个图表
  const initChart = (ref) => {
    if (ref.value) {
      return echarts.init(ref.value);
    }
    return null;
  };

  chartInstances.charging = initChart(chargingChart, 'charging-chart');
  chartInstances.efficiency = initChart(efficiencyChart, 'efficiency-chart');
  chartInstances.distribution = initChart(distributionChart, 'distribution-chart');
  chartInstances.abnormal = initChart(abnormalChart, 'abnormal-chart');
  chartInstances.monthly = initChart(monthlyChart, 'monthly-chart');
  chartInstances.gauge = initChart(powerGauge, 'power-gauge');

  // 更新所有图表数据
  updateAllCharts();
  
  // 添加窗口调整大小的事件监听
  window.addEventListener('resize', handleResize);
};

// 更新所有图表
const updateAllCharts = () => {
  const data = generateMockData();
  updateChargingChart(data.chargingData);
  updateEfficiencyChart(data.efficiencyData);
  updateDistributionChart(data.distributionData);
  updateAbnormalChart(data.abnormalData);
  updateMonthlyChart(data.monthlyData);
  updatePowerGauge();
};

// 更新充放电图表
const updateChargingChart = (data) => {
  if (!chartInstances.charging) return;
  
  const option = {
    title: {
      text: '储能电站充放电趋势',
      textStyle: {
        fontSize: 14
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['充电功率(kW)', '放电功率(kW)', 'SOC(%)'],
      top: '5%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '0%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.time,
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '功率(kW)',
        position: 'left'
      },
      {
        type: 'value',
        name: 'SOC(%)',
        position: 'right',
        min: 0,
        max: 100
      }
    ],
    series: [
      {
        name: '充电功率(kW)',
        type: 'bar',
        barWidth: '30%',
        data: data.chargePower,
        itemStyle: {
          color: '#4CAF50'
        }
      },
      {
        name: '放电功率(kW)',
        type: 'bar',
        barWidth: '30%',
        data: data.dischargePower,
        itemStyle: {
          color: '#2196F3'
        }
      },
      {
        name: 'SOC(%)',
        type: 'line',
        yAxisIndex: 1,
        data: data.soc,
        itemStyle: {
          color: '#FF9800'
        },
        lineStyle: {
          width: 3
        },
        symbolSize: 8
      }
    ]
  };
  
  chartInstances.charging.setOption(option);
};

// 更新电能效率图表
const updateEfficiencyChart = (data) => {
  if (!chartInstances.efficiency) return;
  
  const option = {
    title: {
      text: '电能效率与环境参数关联分析',
      textStyle: {
        fontSize: 14
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        let result = params[0].name + '<br/>';
        params.forEach(param => {
          let value = param.value;
          if (param.seriesName === '效率') {
            value = (value * 100).toFixed(1) + '%';
          } else if (param.seriesName === '温度') {
            value = value + '°C';
          } else if (param.seriesName === '电压') {
            value = value + 'V';
          }
          result += `${param.marker}${param.seriesName}: ${value}<br/>`;
        });
        return result;
      }
    },
    legend: {
      data: ['效率', '温度', '电压'],
      top: '5%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '0%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.time
    },
    yAxis: [
      {
        type: 'value',
        name: '效率',
        min: 0.7,
        max: 1,
        position: 'left',
        axisLabel: {
          formatter: '{value * 100}%'
        }
      },
      {
        type: 'value',
        name: '温度/电压',
        position: 'right'
      }
    ],
    series: [
      {
        name: '效率',
        type: 'line',
        data: data.efficiency,
        yAxisIndex: 0,
        itemStyle: {
          color: '#9C27B0'
        },
        lineStyle: {
          width: 3
        },
        symbolSize: 8
      },
      {
        name: '温度',
        type: 'line',
        data: data.temperature,
        yAxisIndex: 1,
        itemStyle: {
          color: '#F44336'
        }
      },
      {
        name: '电压',
        type: 'line',
        data: data.voltage,
        yAxisIndex: 1,
        itemStyle: {
          color: '#3F51B5'
        }
      }
    ]
  };
  
  chartInstances.efficiency.setOption(option);
};

// 更新能量分配图表
const updateDistributionChart = (data) => {
  if (!chartInstances.distribution) return;
  
  const option = {
    title: {
      text: '储能电站能量分配比例',
      textStyle: {
        fontSize: 14
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b} : {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center',
      data: data.types
    },
    series: [
      {
        name: '能量分配',
        type: 'pie',
        radius: '65%',
        center: ['60%', '50%'],
        data: data.types.map((type, index) => ({
          value: data.values[index],
          name: type
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          formatter: '{b}: {d}%'
        }
      }
    ],
    color: ['#FF5722', '#03A9F4', '#009688', '#FFC107', '#673AB7']
  };
  
  chartInstances.distribution.setOption(option);
};

// 更新异常情况图表
const updateAbnormalChart = (data) => {
  if (!chartInstances.abnormal) return;
  
  const option = {
    title: {
      text: '储能系统异常情况统计',
      textStyle: {
        fontSize: 14
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '0%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.categories,
      axisLabel: {
        interval: 0,
        rotate: 30
      }
    },
    yAxis: {
      type: 'value',
      name: '次数'
    },
    series: [
      {
        name: '异常次数',
        type: 'bar',
        barWidth: '50%',
        data: data.counts,
        itemStyle: {
          color: function(params) {
            const colorList = ['#FFC107', '#FF9800', '#F44336', '#E91E63', '#9C27B0', '#673AB7'];
            return colorList[params.dataIndex];
          }
        },
        label: {
          show: true,
          position: 'top'
        }
      }
    ]
  };
  
  chartInstances.abnormal.setOption(option);
};

// 更新月度电力统计图表
const updateMonthlyChart = (data) => {
  if (!chartInstances.monthly) return;
  
  const option = {
    title: {
      text: '月度电力运行统计',
      textStyle: {
        fontSize: 14
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      },
      formatter: function(params) {
        let result = params[0].name + '<br/>';
        params.forEach(param => {
          let value = param.value;
          if (param.seriesName === '效率') {
            value = (value * 100).toFixed(1) + '%';
          } else {
            value = value + ' kWh';
          }
          result += `${param.marker}${param.seriesName}: ${value}<br/>`;
        });
        return result;
      }
    },
    legend: {
      data: ['发电量', '用电量', '效率'],
      top: '5%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: data.months,
        axisPointer: {
          type: 'shadow'
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '电量(kWh)',
        min: 0
      },
      {
        type: 'value',
        name: '效率',
        min: 0.7,
        max: 1,
        axisLabel: {
          formatter: '{value * 100}%'
        }
      }
    ],
    series: [
      {
        name: '发电量',
        type: 'bar',
        data: data.generated,
        itemStyle: {
          color: '#4CAF50'
        }
      },
      {
        name: '用电量',
        type: 'bar',
        data: data.consumed,
        itemStyle: {
          color: '#2196F3'
        }
      },
      {
        name: '效率',
        type: 'line',
        yAxisIndex: 1,
        data: data.efficiency,
        itemStyle: {
          color: '#FF5722'
        },
        lineStyle: {
          width: 3
        },
        symbolSize: 8
      }
    ]
  };
  
  chartInstances.monthly.setOption(option);
};

// 更新实时功率表盘
const updatePowerGauge = () => {
  if (!chartInstances.gauge) return;

  // 随机生成当前功率值(0-100)
  const powerValue = Math.floor(Math.random() * 100);
  const gaugeRadius = '70%'; // 核心调整项：控制仪表盘大小

  const option = {
    title: {
      text: '实时功率表盘',
      center: ['50%', '60%'], // 位置与半径配合调整
      radius: gaugeRadius, // 半径大小（核心参数）
      textStyle: {
        fontSize: 14
      }
    },
    tooltip: {
      formatter: '{a} <br/>{b} : {c}%'
    },
    series: [
      {
        name: '实时功率',
        type: 'gauge',
        detail: {
          formatter: '{value}%',
          fontSize: 16
        },
        data: [{ value: powerValue, name: '功率负载' }],
        axisLabel: {
          formatter: function(value) {
            return value + '%';
          }
        },
        axisLine: {
          lineStyle: {
            width: 30,
            color: [
              [0.3, '#67e0e3'],
              [0.7, '#37a2da'],
              [1, '#fd666d']
            ]
          }
        },
        pointer: {
          itemStyle: {
            color: 'auto'
          }
        }
      }
    ]
  };

  chartInstances.gauge.setOption(option);
};

// 窗口大小变化处理
const handleResize = () => {
  Object.values(chartInstances).forEach(chart => {
    chart && chart.resize();
  });
};

// 日期范围变更处理
const handleDateRangeChange = () => {
  refreshData();
};

// 刷新数据
const refreshData = () => {
  updateAllCharts();
};

// 在组件挂载后初始化图表
onMounted(() => {
  initCharts();
  // 定时刷新数据
  const timer = setInterval(refreshData, 60000); // 每分钟刷新一次数据
  
  onBeforeUnmount(() => {
    clearInterval(timer);
    window.removeEventListener('resize', handleResize);
    
    // 销毁图表实例
    Object.values(chartInstances).forEach(chart => {
      chart && chart.dispose();
    });
  });
});
</script>

<style scoped>
.power-operation-report {
  width: 100%;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-container {
  display: flex;
  gap: 10px;
}

.chart-container {
  position: relative;
  width: 100%;
  height: calc(100% - 80px);
  min-height: 700px;
}

.chart-item {
  position: absolute;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  background-color: #fff;
  padding: 10px;
  box-sizing: border-box;
}

/* 充放电趋势图 */
#charging-chart {
  top: 0;
  left: 0;
  width: 65%;
  height: 400px;
}

/* 电能效率分析图 */
#efficiency-chart {
  top: 0;
  right: 0;
  width: 34%;
  height: 400px;
}

/* 能量分配比例图 */
#distribution-chart {
  top: 430px;
  left: 0;
  width: 33%;
  height: 400px;
}

/* 异常情况统计图 */
#abnormal-chart {
  top: 430px;
  left: 34%;
  width: 33%;
  height: 400px;
}

/* 实时功率表盘 */
#power-gauge {
  top: 430px;
  right: 0;
  width: 32%;
  height: 400px;
}

/* 月度电力统计图 */
#monthly-chart {
  top: 900px;
  left: 0;
  width: 100%;
  height: 60%;
}
</style>