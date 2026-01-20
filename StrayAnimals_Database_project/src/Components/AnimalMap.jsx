import React, { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium'; // 引入 Cesium 核心库
import 'cesium/Build/Cesium/Widgets/widgets.css'; // 引入样式
import './AnimalMap.css'; 

const AnimalMap = () => {
  const cesiumContainer = useRef(null); // 绑定 DOM 容器
  const viewerRef = useRef(null); // 保存 viewer 实例，方便后续操作

  // 1. 初始化地图
  useEffect(() => {
    if (!cesiumContainer.current) return;

    // 创建 Cesium Viewer
    const viewer = new Cesium.Viewer(cesiumContainer.current, {
      terrainProvider: undefined, // 简单起见，暂不加载地形
      animation: false,      // 隐藏左下角动画控件
      timeline: false,       // 隐藏下方时间轴
      baseLayerPicker: true, // 保留底图切换器 (自带必应、OpenStreet等)
      geocoder: false,       // 隐藏搜索框
      homeButton: true,
      sceneModePicker: true,
      navigationHelpButton: false,
      infoBox: true,         // 点击实体显示信息框
    });

    // 隐藏版权信息 (可选，开发时为了界面干净)
    viewer._cesiumWidget._creditContainer.style.display = "none";

    viewerRef.current = viewer;

    // 组件销毁时清理资源
    return () => {
      viewer.destroy();
    };
  }, []);

  // 2. 获取数据并上图
  useEffect(() => {
    const loadAnimalPoints = async () => {
      if (!viewerRef.current) return;

      try {
        // 请求后端接口
        const response = await fetch('http://localhost:3001/api/map_animals');
        if (!response.ok) throw new Error('地图数据请求失败');
        
        const animals = await response.json();
        const viewer = viewerRef.current;

        // 清除旧的点
        viewer.entities.removeAll();

        // 遍历数据，添加实体 (Entity)
        animals.forEach(animal => {
          // 检查坐标是否存在
          if (animal.longitude && animal.latitude) {
            viewer.entities.add({
              id: `anim-${animal.anim_id}`,
              name: animal.name, // 点击弹窗显示的标题
              description: `
                <div style="padding: 15px; font-family: 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6;">
                  <p style="margin: 0 0 8px 0; color: #6b7280;">
                    <strong style="color: #10b981;">编号:</strong> ${animal.anim_id}
                  </p>
                  <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">
                    <strong style="color: #10b981;">名字:</strong> ${animal.name}
                  </p>
                  <p style="margin: 0; color: #6b7280;">
                     点击右上角按钮以追踪此动物。
                  </p>
                </div>
              `,
              position: Cesium.Cartesian3.fromDegrees(
                parseFloat(animal.longitude), 
                parseFloat(animal.latitude), 
                0 // 高度，设为0贴地
              ),
              point: {
                pixelSize: 10,
                color: Cesium.Color.ORANGE, // 点的颜色
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 贴地模式
              },
              // 如果你想用图标代替点，可以把 point 换成 billboard:
              /*
              billboard: {
                image: '/path/to/icon.png', // 图标路径
                width: 32,
                height: 32
              }
              */
            });
          }
        });

        // 视角飞向数据区域
        if (animals.length > 0) {
          viewer.zoomTo(viewer.entities);
        }

      } catch (error) {
        console.error("地图打点失败:", error);
      }
    };

    // 如果 viewer 初始化完成了，就开始加载数据
    if (viewerRef.current) {
      loadAnimalPoints();
    }
  }, [viewerRef.current]); // 依赖 viewerRef

  return (
    <div className="animal-map-page">
        <h1>动物地图</h1>
        <div className="map-wrapper" style={{ height: '500px', width: '100%', marginTop: '20px' }}>
            {/* 地图容器 */}
        <div 
            ref={cesiumContainer} 
            style={{ width: '100%', height: '100%' }} 
        />
        </div>
    </div>
  );
};

export default AnimalMap;