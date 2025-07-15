// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import PowerDashboard from '../components/PowerDashboard.vue'
import ReactiveCompensation from '@/components/ReactiveCompensation.vue'
//import TemperatureMonitoring from '@/components/TemperatureMonitoring.vue'
import TransformerMonitor from '@/components/TransformerMonitor.vue'
import ElectricMeterMonitor from '@/components/ElectricMeterMonitor.vue'
import BMSStatusMonitor from '@/components/BMSStatusMonitor.vue'
import DCScreenMonitor from '@/components/DCScreenMonitor.vue'
import HourlyMeteringReport from '@/components/HourlyMeteringReport.vue'
import PowerOperationReport from '@/components/PowerOperationReport.vue'
//import AIEnergyAssistant from '@/components/AIEnergyAssistant.vue'
const routes = [
  {
    path: '/power-dashboard',
    name: 'PowerDashboard',
    component: PowerDashboard
  },
  {
    path: '/reactive-compensation',
    name: 'ReactiveCompensation',
    component: ReactiveCompensation
  },
  // {
  //   path: '/temperature-monitoring',
  //   name: 'TemperatureMonitoring',
  //   component:TemperatureMonitoring
  // },
  {
    path: '/Transformer-monitor',
    name: 'TransformerMonitor',
    component:TransformerMonitor
  },
  {
    path: '/electric-metermonitor',
    name: 'ElectricMeterMonitor',
    component:ElectricMeterMonitor
  },
  {
    path: '/bms-status-monitor',
    name: 'BMSStatusMonitor',
    component:BMSStatusMonitor
  },
  {
    path: '/dc-screen-monitor',
    name: 'DCScreenMonitor',
    component:DCScreenMonitor
  },
  {
    path: '/hourly-metering-report',
    name: 'HourlyMeteringReport',
    component:HourlyMeteringReport
  },
  {
    path: '/power-operation-report',
    name: 'PowerOperationReport',
    component: PowerOperationReport
  },
  // {
  //   path: '/ai-energy-assistant',
  //   name: 'AIEnergyAssistant',
  //   component: AIEnergyAssistant
  // },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router