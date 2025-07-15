<template>
  <el-container direction="vertical">
    <!-- 固定头部 -->
    <el-header class="custom-header">
      <div class="header-content">
        <span class="system-title">ReserveSage智慧储能管理系统</span>
        <div class="button-group">
          <el-button>储能系统</el-button>
          <el-button>风电系统</el-button>
          <el-button>光伏系统</el-button>
          <el-button>充电桩</el-button>
          <el-button>柴发系统</el-button>
        </div>
      </div>
    </el-header>

    <!-- 主体容器 -->
    <el-container style="height: calc(100vh - 60px)">
      <!-- 固定侧边栏 -->
       <el-aside>
        <el-menu
          active-text-color="#ffd04b"
          style="width: 100%"
          :default-active="$route.path" 
          router>
          <el-menu-item index="/power-dashboard">电力综合看板</el-menu-item>
         <!----- <el-menu-item index="/">AI智慧储能助手</el-menu-item> --->
         <!----- <el-menu-item index="/temperature-monitoring">全站温度监控</el-menu-item>----->
          <el-menu-item index="/electric-metermonitor">电表监测</el-menu-item>
          <el-menu-item index="/bms-status-monitor">BMS状态监测</el-menu-item>
          <el-menu-item index="/dc-screen-monitor">直流屏监测</el-menu-item>
          <el-menu-item index="/reactive-compensation">无功补偿柜监测</el-menu-item>
          <el-menu-item index="/transformer-monitor">变压器监测</el-menu-item>
          <el-menu-item index="/power-operation-report">电力运行报表</el-menu-item>
          <el-menu-item index="/hourly-metering-report">整点集抄报表</el-menu-item>
       </el-menu>
      </el-aside>

      <!-- 可滚动主内容 -->
      <el-main>
         <router-view /> 
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import { ElMenu, ElMenuItem } from 'element-plus'
export default {
  name: 'ReserveSage',
  components: {
    ElMenu,
    ElMenuItem,
  }
}
</script>

<style scoped>
/* 固定头部 */
.el-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 60px;
  background-color: #0156d5 !important;
  color: white;
  align-items: center;
}

.custom-header {
  height: 60px;
  background-color: #0156d5 !important;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.system-title {
  color: #ecf0f1;
  font-size: 18px;
  font-weight: bold;
}

.button-group .el-button {
  color: #ecf0f1;
  border: none;
  background: transparent;
  margin-left: 15px;
}

.button-group .el-button:hover {
  background-color: rgba(255,255,255,0.1);
}


/* 固定侧边栏 */
.el-aside {
  position: fixed;
  top: 59px;
  bottom: 0;
  left: 0;
  width: 200px !important;
  z-index: 999;
  background-color: #0069d2 !important;
  color: #ecf0f1;
  overflow-y: auto;  /* 启用滚动 */
}

/* 隐藏滚动条 */
.el-aside::-webkit-scrollbar {
  width: 0;
  background: transparent;
}

/* 主内容区 */
.el-main {
  margin-left: 200px;
  margin-top: 60px;
  height: calc(100vh - 60px);
  padding: 0px;
  /* 隐藏滚动条 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}


/* 菜单样式 */
.el-menu {
  background-color: transparent !important;
  border-right: none !important;
}

.el-menu-item {
  color: #ecf0f1 !important;
  transition: all 0.3s ease;
}

.el-menu-item:hover {
  background-color: rgba(255,255,255,0.1) !important;
}

.el-menu-item.is-active {
  background-color: rgba(26,43,60,0.5) !important;
}
</style>