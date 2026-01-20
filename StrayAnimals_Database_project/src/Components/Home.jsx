import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>欢迎来到“暖宠寻踪”流浪动物守护平台！</h1>
        <p>连接自然，守护生命，从每一次点击开始。</p>
      </header>

      <div className="features-grid">
        {/* 卡片 1: 订阅 */}
        <div className="feature-card">
          <div className="icon">📋</div>
          <h2>动物订阅</h2>
          <p>浏览可爱的动物列表，一键订阅您关心的动物，查看它们的详细健康状况。</p>
          <Link to="/subscription">
            <button className="feature-btn">去订阅</button>
          </Link>
        </div>

        {/* 卡片 2: 实时地图 */}
        <div className="feature-card">
          <div className="icon">🌍</div>
          <h2>实时分布地图</h2>
          <p>基于 Cesium 的 3D 地图，直观查看所有动物的最新位置分布。</p>
          <Link to="/map">
            <button className="feature-btn">看地图</button>
          </Link>
        </div>

        {/* 卡片 3: 轨迹追踪 */}
        <div className="feature-card">
          <div className="icon">👣</div>
          <h2>历史轨迹追踪</h2>
          <p>选择特定动物，回放其活动路线，分析活动范围与行为习惯。</p>
          <Link to="/tracks">
            <button className="feature-btn">查轨迹</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;