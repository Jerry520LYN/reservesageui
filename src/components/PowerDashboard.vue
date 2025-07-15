<template>
  <div class="dashboard-container">
    <!-- 六个卡片 -->
    <el-row :gutter="10">
      <el-col :span="4" v-for="(card, index) in cards" :key="index">
        <div :class="['card', card.colorClass]">
          <div class="card-header">
            <i class="el-icon-sunny"></i>
            <span>{{ card.title }}</span>
          </div>
          <div class="card-content">
            <span class="value">{{ card.value }}</span>
            <span class="unit">kWh</span>
          </div>
          <div class="card-footer">
            <span>{{ card.footerTitle }}</span>
            <span>{{ card.footerValue }}</span>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="5" class="chart-row">
      <el-col :span="5">
        <div ref="lineChart" class="power-line-chart"></div>
      </el-col>
     
    </el-row>    
    <el-row :gutter="5" class="chart-row">
      <el-col :span="5">
        <div ref="reactChart" class="power-line-chart"></div>
      </el-col>
    </el-row>
    <el-row :gutter="5" class="chart-row">
      <el-col :span="5">
        <div ref="chargeChart" class="power-line-chart"></div>
      </el-col>
    </el-row>
    <el-row :gutter="5" class="chart-row">
      <el-col :span="5">
        <div ref="avgChart" class="power-line-chart"></div>
      </el-col>
    </el-row>

    <div class="absolute-image-card">
  <img src="@/assets/储能系统.jpg" alt="储能系统" class="absolute-image" />
  <div class="absolute-info-card">
      <h3>储能电站运行状态</h3>

      <!-- 使用 el-descriptions 展示多列信息 -->
      <el-descriptions :column="2" border size="small">
        <!-- 1. 电池相关 -->
        <el-descriptions-item label="SOC">{{ batterySOC }}%</el-descriptions-item>
        <el-descriptions-item label="SOH">{{ batterySOH }}%</el-descriptions-item>
        <el-descriptions-item label="电池电压">{{ batteryVoltage }} V</el-descriptions-item>
        <el-descriptions-item label="电池电流">{{ batteryCurrent }} A</el-descriptions-item>
        <el-descriptions-item label="电池温度">{{ batteryTemp }} ℃</el-descriptions-item>

        <!-- 2. 功率与能量 -->
        <el-descriptions-item label="当前功率">{{ currentPower }} kW</el-descriptions-item>
        <el-descriptions-item label="累计充电电量">{{ totalCharge }} kWh</el-descriptions-item>
        <el-descriptions-item label="累计放电电量">{{ totalDischarge }} kWh</el-descriptions-item>
        <el-descriptions-item label="可用容量">{{ availableCapacity }} kWh</el-descriptions-item>

        <!-- 3. 电网交互 -->
        <el-descriptions-item label="电网电压">{{ gridVoltage }} V</el-descriptions-item>
        <el-descriptions-item label="电网频率">{{ gridFrequency }} Hz</el-descriptions-item>
        <el-descriptions-item label="功率因数">{{ powerFactor }}</el-descriptions-item>

        <!-- 4. 运行模式与策略 -->
        <el-descriptions-item label="运行模式">{{ operationMode }}</el-descriptions-item>
        <el-descriptions-item label="控制方式">{{ controlMode }}</el-descriptions-item>
        <el-descriptions-item label="调度指令">{{ commandText }}</el-descriptions-item>
        <el-descriptions-item label="当前策略">{{ strategyText }}</el-descriptions-item>

        <!-- 5. 环境与安全 -->
        <el-descriptions-item label="环境温度">{{ ambientTemp }} ℃</el-descriptions-item>
        <el-descriptions-item label="环境湿度">{{ humidity }}%</el-descriptions-item>
        <el-descriptions-item label="火灾报警状态">{{ fireAlarmStatus }}</el-descriptions-item>
        <el-descriptions-item label="安全状态">{{ safetyStatus }}</el-descriptions-item>

        <!-- 6. 系统效率与损耗 -->
        <el-descriptions-item label="系统效率">{{ systemEfficiency }}%</el-descriptions-item>
        <el-descriptions-item label="损耗功率">{{ lossPower }} kW</el-descriptions-item>
      </el-descriptions>
    </div>
  </div>
  <!-- 新增的动态柱状图容器 -->
  <div class="absolute-bar-chart">
    <div ref="barChart" class="bar-chart-container"></div>
  </div>

  <!-- 新增的仪表盘容器 -->
  <div class="gauge-container">
    <div ref="socGauge" class="gauge-chart"></div>
    <div ref="sohGauge" class="gauge-chart"></div>
    <div ref="tempGauge" class="gauge-chart"></div>
    <div ref="humidityGauge" class="gauge-chart"></div>
  </div>
  <div class="sankey-container">
    <div ref="sankeyChart" class="sankey-chart"></div>
  </div>

    <!-- 新增的折线图容器 -->
  <div class="absolute-line-chart">
    <div ref="electricityChart" class="line-chart-container"></div>
  </div>
    <div class="heatmap-container">
      <div ref="heatmapChart" class="heatmap-chart"></div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts';
export default {
  name: 'PowerDashboard',
  data() {
    return {
       strategyText: '电网跟随模式',
      modeText: '远程调度',
      commandText: '功率指令 150kW',
      gaugeInstances: {},  // 仪表盘实例集合
      gaugeData: {
        soc: 85,        // 初始SOC值（电池荷电状态）
        soh: 92,        // 初始SOH值（电池健康状态）
        temp: 25,       // 初始温度值（环境温度）
        humidity: 60    // 初始湿度值（环境湿度）
      },
      // 1. 电池相关
      batterySOC: 85,       // 电池荷电状态
      batterySOH: 92,       // 电池健康状态
      batteryVoltage: 700,  // 电池电压
      batteryCurrent: 50,   // 电池电流
      batteryTemp: 28,      // 电池温度

      // 2. 功率与能量
      currentPower: -45.2,     // 当前充放电功率（负值为放电）
      totalCharge: 2314.6,     // 累计充电量
      totalDischarge: 32415.8, // 累计放电量
      availableCapacity: 1000, // 可用容量

      // 3. 电网交互
      gridVoltage: 220,       // 电网电压
      gridFrequency: 50.02,    // 电网频率
      powerFactor: 0.98,      // 功率因数

      // 4. 运行模式与策略
      operationMode: '削峰填谷',
      controlMode: '远程调度',

      // 5. 环境与安全
      ambientTemp: 25,
      humidity: 60,
      fireAlarmStatus: '正常',
      safetyStatus: '正常',

      // 6. 系统效率与损耗
      systemEfficiency: 92, // 系统效率
      lossPower: 2.5,       // 损耗功率
      cards: [
        {
          title: '实时上网电量',
          value: '58.6',
          footerTitle: '本月累计',
          footerValue: '15842.6 kWh',
          colorClass: 'card-pink'
        },
        {
          title: '实时下网电量',
          value: '32.1',
          footerTitle: '本月累计',
          footerValue: '8923.4 kWh',
          colorClass: 'card-blue'
        },
        {
          title: '光伏发电功率',
          value: '68.4',
          footerTitle: '今日发电量',
          footerValue: '483.7 kWh',
          colorClass: 'card-purple'
        },
        {
          title: '储能放电功率',
          value: '45.2',
          footerTitle: '本月放电量',
          footerValue: '32415.8 kWh',
          colorClass: 'card-green'
        },
        {
          title: '储能充电功率',
          value: '38.9',
          footerTitle: '本月充电量',
          footerValue: '2314.6 kWh',
          colorClass: 'card-blue'
        },
        {
          title: '风电发电功率',
          value: '22.7',
          footerTitle: '今日发电量',
          footerValue: '186.3 kWh',
          colorClass: 'card-purple'
        }
      ],
      chartInstances: {},    // 图表实例集合
      timeLabelsMap: {},     // 时间标签集合
      chartDataMap: {},      // 图表数据集合
      updateInterval: null,
      dataLength: 30,       // 最大数据点数
      basePower: 120,        // 基础功率值
    };
  },
  mounted() {
    this.initLineChart(
      'powerChart',
      this.$refs.lineChart,
      '总有功功率实时曲线图'
    );
    this.initLineChart(
      'reactChart',
      this.$refs.reactChart,
      '总无功率实时曲线图'
    );
    this.initLineChart(
      'chargeChart',
      this.$refs.chargeChart,
      '充电功率实时曲线图'
    );
    this.initLineChart(
      'avgChart',
      this.$refs.avgChart,
      '平均功率实时曲线图'
    );
    this.startDataUpdate();
    this.initBarChart();
    this.updateBarData(0,0);
    this.initGauges();
    this.initSankeyChart();
    this.initElectricityChart();
    this.initHeatmap();
  },
  beforeUnmount() {
    Object.values(this.chartInstances).forEach(chart => chart.dispose());
    clearInterval(this.updateInterval);
  },
  methods: {
    generateDataPoint(offset) {
        // 基础功率（可动态变化）
      const basePower = this.basePower;
      
      // 增大正弦波振幅（原 40 → 60） + 增大随机扰动范围（原 30 → 50）
      const sineWave = Math.sin((offset * Math.PI) / 10) * 60; // 更大的周期性波动
      const randomNoise = Math.random() * 50 - 25;            // ±25 随机扰动
      const newValue = basePower + sineWave + randomNoise;
      
      // 限制最小值为 0，最大值不超过基础功率的 200%
      return Math.max(0, Math.min(newValue, basePower * 2)).toFixed(1);
    },

    formatTime(date) {
      return `${date.getHours().toString().padStart(2, '0')}:${date
        .getMinutes()
        .toString()
        .padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    },

    startDataUpdate() {
    this.updateInterval = setInterval(() => {
      const newTime = new Date();
      
      // 遍历所有图表进行更新
      Object.keys(this.chartInstances).forEach(chartName => {
        // 更新数据队列
        this.timeLabelsMap[chartName].push(this.formatTime(newTime));
        this.timeLabelsMap[chartName] = this.timeLabelsMap[chartName].slice(-this.dataLength);
        
        // 生成差异化的数据点 (示例使用偏移量)
        const offset = chartName === 'powerChart' ? 0 : 5;
        this.chartDataMap[chartName].push(this.generateDataPoint(offset));
        this.chartDataMap[chartName] = this.chartDataMap[chartName].slice(-this.dataLength);

        // 更新图表
        this.chartInstances[chartName].setOption({
          xAxis: { data: this.timeLabelsMap[chartName] },
          series: [{ data: this.chartDataMap[chartName] }]
        });
      });
    }, 2000);
  },

    initLineChart(chartName, chartRef, title) {
      // 初始化数据存储
      this.timeLabelsMap[chartName] = [];
      this.chartDataMap[chartName] = [];
      
      // 创建图表实例
      this.chartInstances[chartName] = echarts.init(chartRef);
      
      // 完整图表配置
      const option = {
        title: {
          text: title,
          left: 'center',
          textStyle: {
            color: '#666',
            fontSize: 16
          }
        },
        tooltip: {
          trigger: 'axis',
          formatter: '{b0}<br/>{a0}: {c0}kW'
        },
        xAxis: {
          type: 'category',
          data: this.timeLabelsMap[chartName],
          axisLabel: {
            interval: 4,
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          name: '功率(kW)',
          axisLabel: { formatter: '{value}' },
          splitLine: {
            lineStyle: { color: ['#eee'] }
          }
        },
        series: [{
          data: this.chartDataMap[chartName],
          name: '实时曲线',
          type: 'line',
          smooth: true,
          itemStyle: { color: '#3a7bd5' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(58,123,213,0.4)' },
                { offset: 1, color: 'rgba(58,123,213,0.05)' }
              ]
            }
          }
        }]
      };
      
      this.chartInstances[chartName].setOption(option);
    },
     initBarChart() {
    const chartDom = this.$refs.barChart;
    this.barChartInstance = echarts.init(chartDom);
    
    // 初始数据
    this.barData = [2314.6, 32415.8]; // 对应累计充电和放电
    this.barInterval = setInterval(() => {
      this.updateBarData();
    }, 3000);
    
    // 配置选项
    const option = {
      title: {
        text: '累计充放电动态展示', // 添加标题文本
        left: 'center', // 居中显示
        top: 10, // 距离顶部10px
        textStyle: {
          fontSize: 16,
          color: '#2a3f54', // 与图表主色调一致
          fontWeight: 'bold'
        }
      },
      xAxis: {
        max: 'dataMax',
        type: 'value', // 横轴改为数值轴
        position: 'top' // 将横轴移到顶部
      },
      yAxis: {
        type: 'category',
        data: ['累计放电（kWh）', '累计充电（kWh）'],
        inverse: true,
        axisLabel: {
          show: true
        }
      },
      series: [{
        realtimeSort: true,
        name: '电量',
        type: 'bar',
        data: this.barData,
        label: {
          show: true,
          position: 'right',
          valueAnimation: true
        },
        itemStyle: {
          color: '#2a3f54'
        }
      }],
      grid: {
        left: 120, // 给数值标签留出空间
        right: 80, // 减小右侧留白
        bottom: 20, // 重点调整：减小底部留
      },
      animationDuration: 0,
      animationDurationUpdate: 3000,
      animationEasing: 'linear',
      animationEasingUpdate: 'linear'
    };
    
    this.barChartInstance.setOption(option);
  },
  
updateBarData() {
  // 修正后的数据更新逻辑（使用下划线命名未使用的参数）
  this.barData = this.barData.map((val) => {
    // 根据原始数据规模生成合理增量
    const baseIncrease = val > 30000 ? 1000 : 100;
    const randomFactor = Math.random();
    const increase = randomFactor > 0.7 
      ? Math.round(randomFactor * 2000) 
      : Math.round(randomFactor * baseIncrease);
    
    // 保持数据合理性（不超过原始值的150%）
    const maxValue = val * 1.5;
    return Math.min(val + increase, maxValue);
  });
  
  this.barChartInstance.setOption({
    series: [{
      type: 'bar',
      data: this.barData
    }]
  });
  },
  initGauges() {
    const gaugeConfigs = {
      soc: {
        title: 'SOC 状态',
        max: 100,
        color: '#4CAF50',
        suffix: '%'
      },
      soh: {
        title: 'SOH 健康',
        max: 100,
        color: '#2196F3',
        suffix: '%'
      },
      temp: {
        title: '环境温度',
        max: 50,
        color: '#FF9800',
        suffix: '℃'
      },
      humidity: {
        title: '环境湿度',
        max: 100,
        color: '#00BCD4',
        suffix: '%'
      }
    };

    Object.keys(gaugeConfigs).forEach(key => {
      const config = gaugeConfigs[key];
      const chartDom = this.$refs[`${key}Gauge`];
      const myChart = echarts.init(chartDom);
       
      const option = {
        tooltip: {
          formatter: `{a} <br/>{b}: {c}${config.suffix}`
        },
        series: [{
          name: config.title,
          type: 'gauge',
          min: 0,
          max: config.max,
          splitNumber: 10,
          itemStyle: {
            color: config.color
          },
          progress: {
            show: true,
            width: 5
          },
          axisLine: {
            lineStyle: {
              width: 30
            }
          },
          axisTick: {
            distance: -1,
            splitNumber: 5,
            lineStyle: {
              width: 2,
              color: '#999'
            }
          },
          splitLine: {
            distance: -25,
            length: 5,
            lineStyle: {
              width: 3,
              color: '#999'
            }
          },
          axisLabel: {
            distance: -1,
            color: '#999',
            fontSize: 12
          },
          anchor: {
            show: false
          },
          title: {
          show: true,
          text: config.title, // 使用配置中的标题
          fontSize: 16,       // 标题字体大小
          fontWeight: 'bold', // 加粗显示
          color: '#333',      // 标题颜色
          offsetCenter: [0, '110%'] // 距离中心位置（向上偏移）
          },
          detail: {
            valueAnimation: true,
            width: '10%',
            lineHeight: 20,
            borderRadius: 8,
            offsetCenter: [0, '50%'],
            fontSize: 10,
            formatter: `{value} ${config.suffix}`,
            color: 'inherit'
          },
          data: [{
            value: this.gaugeData[key],
            name: config.title
          }]
        }]
      };
      
        myChart.setOption(option);
        this.gaugeInstances[key] = myChart;
      });

      // 启动数据更新
      this.startGaugeUpdate();
    },
  startGaugeUpdate() {
    setInterval(() => {
      // 模拟SOC变化（80-95之间波动，保留两位小数）
      this.gaugeData.soc = parseFloat((Math.min(95, Math.max(80, 
        this.gaugeData.soc + (Math.random() * 4 - 2)
      ))).toFixed(2));
      
      // 模拟SOH变化（90-95之间波动，保留两位小数）
      this.gaugeData.soh = parseFloat((Math.min(95, Math.max(90,
        this.gaugeData.soh + (Math.random() * 1 - 0.5)
      ))).toFixed(2));
      
      // 模拟温度变化（20-35之间波动，保留两位小数）
      this.gaugeData.temp = parseFloat((Math.min(35, Math.max(20,
        this.gaugeData.temp + (Math.random() * 2 - 1)
      ))).toFixed(2));
      
      // 模拟湿度变化（50-70之间波动，保留两位小数）
      this.gaugeData.humidity = parseFloat((Math.min(70, Math.max(50,
        this.gaugeData.humidity + (Math.random() * 2 - 1)
      ))).toFixed(2));
    
     // 更新所有仪表盘
     Object.keys(this.gaugeInstances).forEach(key => {
      const currentOption = this.gaugeInstances[key].getOption();
      this.gaugeInstances[key].setOption({
        series: [{
          data: [{
            value: this.gaugeData[key],
            name: currentOption.series[0].name
              }]
            }]
          });
        });
    }, 2000);
  },

    initSankeyChart() {
    const chartDom = this.$refs.sankeyChart;
    const myChart = echarts.init(chartDom);

    const option = {
      title: {
      text: '储能系统日能量流向',
      left: 'center',
      textStyle: {
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove'
    },
    series: [{
      type: 'sankey',
      layout: 'none',
      emphasis: {
        focus: 'adjacency'
      },
      data: [
        { name: '电网购电' },
        { name: '光伏发电' },
        { name: '储能充电' },
        { name: '储能放电' },
        { name: 'PCS损耗' },
        { name: '电池损耗' },
        { name: '用户负荷' },
        { name: '电网售电' }
      ],
      links: [
        { source: '电网购电', target: '储能充电', value: 80 },
        { source: '光伏发电', target: '储能充电', value: 120 },
        { source: '储能充电', target: 'PCS损耗', value: 10 },
        { source: '储能充电', target: '电池损耗', value: 15 },
        { source: '储能充电', target: '储能放电', value: 175 },
        { source: '储能放电', target: 'PCS损耗', value: 8 },
        { source: '储能放电', target: '用户负荷', value: 100 },
        { source: '储能放电', target: '电网售电', value: 67 }
      ],
      lineStyle: {
        color: 'source',
        curveness: 0.5
      },
      label: {
        fontSize: 12
      }
    }]
    };

    myChart.setOption(option);

    // 存储图表实例以便后续操作
    this.sankeyChartInstance = myChart;
  },
  initElectricityChart() {
    const chartDom = this.$refs.electricityChart;
    const myChart = echarts.init(chartDom);

    const option = {
      title: {
        text: 'Distribution of Electricity',
        subtext: 'Fake Data'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      toolbox: {
        show: true,
        feature: {
          saveAsImage: {}
        }
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['00:00', '01:15', '02:30', '03:45', '05:00', '06:15', '07:30', '08:45', '10:00', '11:15', '12:30', '13:45', '15:00', '16:15', '17:30', '18:45', '20:00', '21:15', '22:30', '23:45']
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value} W'
        },
        axisPointer: {
          snap: true
        }
      },
      visualMap: {
        show: false,
        dimension: 0,
        pieces: [
          { lte: 6, color: 'green' },
          { gt: 6, lte: 8, color: 'red' },
          { gt: 8, lte: 14, color: 'green' },
          { gt: 14, lte: 17, color: 'red' },
          { gt: 17, color: 'green' }
        ]
      },
      series: [
        {
          name: 'Electricity',
          type: 'line',
          smooth: true,
          data: [300, 280, 250, 260, 270, 300, 550, 500, 400, 390, 380, 390, 400, 500, 600, 750, 800, 700, 600, 400],
          markArea: {
            itemStyle: {
              color: 'rgba(255, 173, 177, 0.4)'
            },
            data: [
              [
                { name: 'Morning Peak', xAxis: '07:30' },
                { xAxis: '10:00' }
              ],
              [
                { name: 'Evening Peak', xAxis: '17:30' },
                { xAxis: '21:15' }
              ]
            ]
          }
        }
      ]
    };

    myChart.setOption(option);

    // 存储实例以便后续操作（如销毁）
    this.electricityChartInstance = myChart;
  },
   initHeatmap() {
      const noise = this.getNoiseHelper();
      let xData = [];
      let yData = [];
      noise.seed(Math.random());

      const generateData = () => {
        let data = [];
        for (let i = 0; i <= 200; i++) {
          for (let j = 0; j <= 100; j++) {
            data.push([i, j, noise.perlin2(i / 40, j / 20) + 0.5]);
          }
          xData.push(i);
        }
        for (let j = 0; j < 100; j++) {
          yData.push(j);
        }
        return data;
      };

      const data = generateData(2, -5, 5);

      const option = {
        tooltip: {},
        xAxis: {
          type: 'category',
          data: xData
        },
        yAxis: {
          type: 'category',
          data: yData
        },
        visualMap: {
          min: 0,
          max: 1,
          calculable: true,
          realtime: false,
          inRange: {
            color: [
              '#313695', '#4575b4', '#74add1', '#abd9e9', 
              '#e0f3f8', '#ffffbf', '#fee090', 
              '#fdae61', '#f46d43', '#d73027', '#a50026'
            ]
          }
        },
        grid: {
            top: 50,        // 顶部留白
            bottom: 30,     // 底部留白
            left: 80,       // 左侧空间
            right: 30       // 右侧空间
          },
        series: [{
          name: 'Gaussian',
          type: 'heatmap',
          data: data,
          emphasis: {
            itemStyle: {
              borderColor: '#333',
              borderWidth: 1
            }
          },
          progressive: 1000,
          animation: false
        }]
      };

      this.heatmapChart = echarts.init(this.$refs.heatmapChart);
      this.heatmapChart.setOption(option);
    },

    getNoiseHelper() {
      class Grad {
        constructor(x, y, z) {
          this.x = x;
          this.y = y;
          this.z = z;
        }
        dot2(x, y) {
          return this.x * x + this.y * y;
        }
        dot3(x, y, z) {
          return this.x * x + this.y * y + this.z * z;
        }
      }

      const grad3 = [
        new Grad(1,1,0), new Grad(-1,1,0), new Grad(1,-1,0), new Grad(-1,-1,0),
        new Grad(1,0,1), new Grad(-1,0,1), new Grad(1,0,-1), new Grad(-1,0,-1),
        new Grad(0,1,1), new Grad(0,-1,1), new Grad(0,1,-1), new Grad(0,-1,-1)
      ];

      const p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,
        140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,
        75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,
        56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,
        77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,
        245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,
        89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,
        64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,
        59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,
        154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,
        79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,
        144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,
        199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,
        222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];

      let perm = new Array(512);
      let gradP = new Array(512);

      function seed(seed) {
        if (seed > 0 && seed < 1) seed *= 65536;
        seed = Math.floor(seed);
        if (seed < 256) seed |= seed << 8;
        
        for (let i = 0; i < 256; i++) {
          let v = (i & 1) ? p[i] ^ (seed & 255) : p[i] ^ ((seed >> 8) & 255);
          perm[i] = perm[i + 256] = v;
          gradP[i] = gradP[i + 256] = grad3[v % 12];
        }
      }

      seed(0);

      function fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
      }

      function lerp(a, b, t) {
        return (1 - t) * a + t * b;
      }

      return {
        seed,
        perlin2: function(x, y) {
          let X = Math.floor(x), Y = Math.floor(y);
          x -= X; y -= Y;
          X &= 255; Y &= 255;

          let n00 = gradP[X + perm[Y]].dot2(x, y);
          let n01 = gradP[X + perm[Y + 1]].dot2(x, y - 1);
          let n10 = gradP[X + 1 + perm[Y]].dot2(x - 1, y);
          let n11 = gradP[X + 1 + perm[Y + 1]].dot2(x - 1, y - 1);

          let u = fade(x);
          return lerp(lerp(n00, n10, u), lerp(n01, n11, u), fade(y));
        }
      };
    }
},
}
</script>

<style scoped>
.dashboard-container {
  position: relative;
  padding: 0px;
}

.card {
  height: 90px;
  color: white;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.absolute-image-card {
  position: absolute;
  top: 120px; /* 距离顶部220px，可按需调整 */
  left: 340px; 
  width: 600px; /* 固定宽度 */
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 10;
}

.absolute-image {
  width: 100%;
  height: auto;
  display: block;
}

.absolute-info-card {
  padding: 5px;
  font-size: 14px;
  color: #333;
}

.absolute-info-card h3 {
  margin-top: 0;
  font-size: 20px;
  margin-bottom: 10px;
}

.absolute-info-card ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.absolute-info-card li {
  margin-bottom: 8px;
}

/* 卡片颜色样式保持不变... */
.card-pink {
  background: linear-gradient(to right, #ff6b6b, #fa8231);
}

.card-blue {
  background: linear-gradient(to right, #3a7bd5, #3a6073);
}

.card-purple {
  background: linear-gradient(to right, #6a11cb, #2575fc);
}

.card-green {
  background: linear-gradient(to right, #05c46b, #84fab0);
}

.card-header {
  display: flex;
  align-items: center;
  font-size: 12px;
}

.card-header i {
  margin-right: 6px;
}

.card-content {
  font-size: 20px;
  display: flex;
  align-items: center;
}

.card-content .unit {
  font-size: 14px;
  margin-left: 8px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.power-line-chart {
  height: 205px;
  width: 100%;
  background: #fff;
}
.absolute-bar-chart {
  position: absolute;
  top: 120px; /* 初始位置可根据需求调整 */
  left: 950px; /* 初始位置可根据需求调整 */
  width: 750px;
  height: 200px;
}

.bar-chart-container {
  width: 100%;
  height: 100%;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.gauge-container {
  position: absolute;
  top: 325px;
  left: 945px; /* 与储能系统卡片对齐 */
  width: 750px; /* 增加宽度以容纳四个仪表盘 */
  display: flex;
  justify-content: space-between;
  overflow-x: auto; /* 添加水平滚动条以防内容溢出 */
}

.gauge-chart {
  width: 180px; /* 每个仪表盘固定宽度 */
  height: 210px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 8px;
  flex-shrink: 0; /* 防止压缩 */
}

.sankey-container {
  position: absolute;
  top: 550px; /* 根据实际布局调整 */
  left: 945px; /* 与储能系统卡片对齐 */
  width: 720px;
  height: 300px;
}

.sankey-chart {
  width: 100%;
  height: 115%;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 8px;

}

.sankey-label {
  font-size: 0.8em;
  text-align: center;
  margin-top: 5px;
  color: #666;
}

.absolute-line-chart {
  position: absolute;
  top: 900px; 
  left: 10px; 
  width: 675px; 
  height: 220px;
  z-index: 100;
}

.line-chart-container {
  width: 100%;
  height: 110%;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.heatmap-container {
  position: absolute;
  top:900px;
  right: 20px;
  left:700px;
  width: 1000px;
  height: 231px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.15);
  z-index: 20; /* 确保在最上层 */
}

.heatmap-chart {
  width: 100%;
  height: 100%;
}


</style>