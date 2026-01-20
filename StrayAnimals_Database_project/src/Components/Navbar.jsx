import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        🐾 动物守护系统
      </div>
      <ul className="navbar-links">
        <li>
          <NavLink 
            to="/" 
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            首页 (Home)
          </NavLink>
        </li>
        <li>
          <NavLink 
            to="/subscription" 
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            动物订阅 (Subscription)
          </NavLink>
        </li>
        <li>
          <NavLink 
            to="/map" 
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            实时地图 (AnimalMap)
          </NavLink>
        </li>
        <li>
          <NavLink 
            to="/tracks" 
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            轨迹追踪 (TrackMap)
          </NavLink>
        </li>
        <li>
          <NavLink 
            to="/addDisc" 
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            上传新发现 (AddNewDiscovery)
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;