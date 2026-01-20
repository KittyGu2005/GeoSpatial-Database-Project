import { useState } from 'react'
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'
import Navbar from './Components/Navbar';
import Home from './Components/Home';
import AnimalSubscription from './Components/Subscribe_Affair'
import AnimalMap from './Components/AnimalMap'
import AnimalTrackMap from './Components/AnimalTrackMap'
import UpdateDiscovery from './Components/UpdateDiscovery';

function App() {

  return (
    <Router>
      {/* 导航栏放在 Routes 外面，这样它会一直显示在顶部 */}
      <Navbar />

      {/* 路由容器，根据 URL 切换显示不同的组件 */}
      <Routes>
        {/* 默认路径显示首页 */}
        <Route path="/" element={<Home />} />
        
        {/* 其他页面路由 */}
        <Route path="/subscription" element={<AnimalSubscription />} />
        <Route path="/map" element={<AnimalMap />} />
        <Route path="/tracks" element={<AnimalTrackMap />} />
        <Route path="/addDisc" element={<UpdateDiscovery />} />
      </Routes>
    </Router>
  )
}

export default App
