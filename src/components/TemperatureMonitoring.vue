<!-- TemperatureMonitor.vue -->
<template>
  <div class="temperature-monitor-container">
    <!-- 顶部状态栏 -->
    <div class="header">
      <div class="title">
        <h1>储能电站温度监测系统</h1>
      </div>
      <div class="system-status">
        <div class="status-item">
          <el-icon><Clock /></el-icon>
          <span class="label">系统时间：</span>
          <span class="value">{{ currentTime }}</span>
        </div>
        <div class="status-item">
          <el-icon><Warning /></el-icon>
          <span class="label">告警数量：</span>
          <span class="value warning" v-if="warningCount > 0">{{ warningCount }}</span>
          <span class="value" v-else>0</span>
        </div>
        <div class="status-item">
          <el-icon><Monitor /></el-icon>
          <span class="label">系统状态：</span>
          <el-tag :type="systemStatusType" effect="dark">{{ systemStatusText }}</el-tag>
        </div>
      </div>
    </div>
    
    <!-- 温度监测区域（主体） -->
    <div class="monitoring-area">
      <!-- 每个区域的温度卡片 -->
      <temperature-card
        v-for="area in temperatureAreas"
        :key="area.id"
        :data="area"
        @show-risk-assessment="showRiskAssessment"
      />
    </div>
    
    <!-- 底部工具栏 -->
    <div class="footer">
      <div class="settings">
        <el-button-group>
          <el-button type="primary" plain @click="refreshData">
            <el-icon><Refresh /></el-icon> 刷新数据
          </el-button>
          <el-button type="warning" plain @click="checkAlarms">
            <el-icon><Bell /></el-icon> 检查告警
          </el-button>
        </el-button-group>
        
        <el-select v-model="refreshInterval" placeholder="刷新间隔" size="default">
          <el-option label="10秒" :value="10" />
          <el-option label="30秒" :value="30" />
          <el-option label="1分钟" :value="60" />
          <el-option label="5分钟" :value="300" />
          <el-option label="不自动刷新" :value="0" />
        </el-select>
      </div>
      
      <div class="legend">
        <div class="legend-item">
          <span class="legend-color normal"></span>
          <span>正常</span>
        </div>
        <div class="legend-item">
          <span class="legend-color warning"></span>
          <span>警告</span>
        </div>
        <div class="legend-item">
          <span class="legend-color danger"></span>
          <span>危险</span>
        </div>
      </div>
    </div>
    
    <!-- AI风险评估对话框 -->
    <ai-risk-dialog
      v-if="selectedArea"
      v-model:visible="riskDialogVisible"
      :area="selectedArea"
    />
  </div>
</template>

<script setup>
import { ref,  computed, onMounted, onUnmounted } from 'vue';
import { Clock, Warning, Monitor, Refresh, Bell } from '@element-plus/icons-vue';
import TemperatureCard from './TemperatureCard.vue';
// import AIRiskDialog from './AIRiskDialog.vue';
// import axios from 'axios';
import { generateAreaTemperatures } from './temperature-mock.js';

// 状态数据
const currentTime = ref('');
const temperatureAreas = ref([]);
const refreshInterval = ref(30); // 默认30秒刷新一次
const riskDialogVisible = ref(false);
const selectedArea = ref(null);
let refreshTimer = null;

// 计算属性
const warningCount = computed(() => {
  return temperatureAreas.value.filter(area => area.status !== 'normal').length;
});

const systemStatusType = computed(() => {
  if (warningCount.value === 0) return 'success';
  const hasDanger = temperatureAreas.value.some(area => area.status === 'danger');
  return hasDanger ? 'danger' : 'warning';
});

const systemStatusText = computed(() => {
  if (warningCount.value === 0) return '正常';
  const hasDanger = temperatureAreas.value.some(area => area.status === 'danger');
  return hasDanger ? '异常' : '注意';
});

// 方法
async function loadTemperatureData() {
  try {
    // 实际应用中应使用axios获取数据
    // const response = await axios.get('/api/temperature/areas');
    // temperatureAreas.value = response.data.data;
    
    // 这里使用模拟数据
    temperatureAreas.value = generateAreaTemperatures();
    
    updateCurrentTime();
  } catch (error) {
    console.error('Failed to load temperature data:', error);
  }
}

function updateCurrentTime() {
  const now = new Date();
  const options = { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false
  };
  currentTime.value = now.toLocaleString('zh-CN', options);
}

function refreshData() {
  loadTemperatureData();
}

function checkAlarms() {
  const warnings = temperatureAreas.value.filter(area => area.status !== 'normal');
  if (warnings.length === 0) {
    ElMessage({
      message: '当前系统运行正常，无告警信息',
      type: 'success'
    });
  } else {
    const dangerous = warnings.filter(area => area.status === 'danger').length;
    const warningOnly = warnings.length - dangerous;
    
    ElMessage({
      dangerouslyUseHTMLString: true,
      message: `<strong>检测到${warnings.length}个告警</strong><br/>危险: ${dangerous}个<br/>警告: ${warningOnly}个`,
      type: 'warning',
      duration: 5000
    });
  }
}

function showRiskAssessment(area) {
  selectedArea.value = area;
  riskDialogVisible.value = true;
}

// 生命周期钩子
onMounted(() => {
  loadTemperatureData();
  
  // 设置定时刷新
  watchRefreshInterval();
  
  // 监听浏览器窗口大小变化
  window.addEventListener('resize', handleResize);
});

// 监听刷新间隔变化
function watchRefreshInterval() {
  // 初始设置定时器
  setupRefreshTimer();
  
  // 监听变化
  watch(refreshInterval, () => {
    clearRefreshTimer();
    setupRefreshTimer();
  });
}

function setupRefreshTimer() {
  if (refreshInterval.value > 0) {
    refreshTimer = setInterval(() => {
      refreshData();
    }, refreshInterval.value * 1000);
  }
}

function clearRefreshTimer() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

function handleResize() {
  // 窗口大小调整时的处理逻辑
  // 这里可以留空，因为我们使用的是绝对定位布局
}

// 清理工作
onUnmounted(() => {
  clearRefreshTimer();
  window.removeEventListener('resize', handleResize);
});

// 导入Vue的watch API
import { watch } from 'vue';

// ElMessage组件
import { ElMessage } from 'element-plus';

</script>

<style scoped>
.temperature-monitor-container {
  width: 1600px;
  height: 100%;
  min-height: 800px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  position: relative;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background-color: #f5f7fa;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.title h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.system-status {
  display: flex;
  gap: 30px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-item .label {
  font-size: 14px;
  color: #606266;
}

.status-item .value {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.status-item .warning {
  color: #E6A23C;
  font-weight: bold;
}

.monitoring-area {
  flex: 1;
  position: relative;
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  min-height: 800px;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.settings {
  display: flex;
  gap: 15px;
  align-items: center;
}

.legend {
  display: flex;
  gap: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-color.normal {
  background-color: #67C23A;
}

.legend-color.warning {
  background-color: #E6A23C;
}

.legend-color.danger {
  background-color: #F56C6C;
}
</style>