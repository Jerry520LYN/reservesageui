# ReserveSage UI 技术文档

## 1. 项目概述

ReserveSage UI 是一个用于储能系统监控和管理的Web界面。它旨在提供一个直观、实时的数据展示平台，帮助用户了解储能系统的运行状态、能耗数据和关键性能指标。通过集成AI能源助手和各种监控模块，本项目旨在优化能源管理效率，提高系统可靠性。

## 2. 功能介绍

- **AI能源助手 (AIEnergyAssistant.vue)**：提供智能化的能源管理建议和分析。
- **BMS状态监测 (BMSStatusMonitor.vue)**：实时监测电池管理系统（BMS）的各项参数，确保电池安全运行。
- **DC屏监测 (DCScreenMonitor.vue)**：显示直流配电系统的运行状态和关键数据。
- **电表监测 (ElectricMeterMonitor.vue)**：监控电能表的实时读数和历史数据。
- **每小时计量报告 (HourlyMeteringReport.vue)**：生成每小时的能源计量报告，便于数据分析。
- **电力仪表盘 (PowerDashboard.vue)**：提供一个总览的电力数据仪表盘，展示关键电力参数。
- **电力运行报告 (PowerOperationReport.vue)**：生成详细的电力运行报告。
- **无功补偿 (ReactiveCompensation.vue)**：监测和控制无功补偿设备，优化电能质量。
- **温度监测 (TemperatureMonitoring.vue)**：实时监测系统内部的温度分布，预警过热风险。
- **变压器监测 (TransformerMonitor.vue)**：监控变压器的运行状态和健康状况。

## 3. 部署过程

本项目是基于Vue.js开发的前端应用。以下是部署步骤：

### 3.1 环境准备

确保您的系统已安装以下软件及对应版本：

- Node.js v20.18.3
- npm 2.15.12
- Yarn 1.22.22

可通过以下命令验证版本（Windows PowerShell）：
```powershell
node --version; npm --version; yarn --version
```

### 3.2 获取代码

```bash
git clone <您的项目仓库地址>
cd reservesageui
```

### 3.3 安装依赖

```bash
yarn install
# 或者使用 npm:
npm install
```

### 3.4 运行开发服务器 (可选)

如果您想在本地进行开发或测试，可以运行开发服务器：

```bash
npm run serve
```

这将在本地启动一个开发服务器，通常在 `http://localhost:8080` 上可访问。

## 4. 协作开发指南

遵循以下Git协作流程：

1. 克隆仓库：
```bash
git clone <项目仓库地址>
```

2. 创建功能分支：
```bash
git checkout -b feature/your-feature-name
# 如果已经克隆并创建分支，在每次工作拉取对应分支的最新代码
git pull origin main
命名规则说明：

 1. 前缀规范 ：
   
   - refactor/ 表示架构/代码重构
   - feature/ 用于新功能开发（现有规范）
   - hotfix/ 用于紧急修复
 2.  描述部分 ：
   
   - 使用小写字母和连字符
   - 包含重构目标（如 overhaul ）和时间标识（如 2024 ）
   - 示例： refactor/core-module-2024Q3
 3. 注意事项 ：
   - 协作建议 ：添加开发者标识： refactor/major-restructure-zhangsan;使用任务编号： refactor/TRD-123-major-restructure
   - 避免使用 update / change 等模糊词汇
   - 长度控制在35个字符以内
```

3. 开发完成后推送分支：
```bash
git push origin feature/your-feature-name
```

4. 在GitHub创建Pull Request进行代码审查
5. 合并通过后删除本地分支：
```bash
git branch -d feature/your-feature-name
```

完整协作指南请参考<mcfile name="Git多人协作的使用方法.md" path="d:\ReserveSage\reservesageui\Git多人协作的使用方法.md"></mcfile>

## 5. 技术栈和版本

本项目主要基于以下技术栈和版本：

### 4.1 核心依赖

- **Vue**: ^3.2.13
- **Vue Router**: ^4.5.1
- **Element Plus**: ^2.9.11
- **Echarts**: ^5.6.0
- **Three.js**: ^0.177.0
- **Core-js**: ^3.8.3
- **Mock**: ^0.1.1
- **MockJS**: ^1.1.0

### 4.2 开发依赖

- **@vue/cli-plugin-babel**: ~5.0.0
- **@vue/cli-plugin-eslint**: ~5.0.0
- **@vue/cli-service**: ~5.0.0
- **@babel/core**: ^7.12.16
- **@babel/eslint-parser**: ^7.12.16
- **@typescript-eslint/eslint-plugin**: ^8.33.0
- **@typescript-eslint/parser**: ^8.33.0
- **Eslint**: ^7.32.0
- **Eslint-plugin-vue**: ^8.0.3
