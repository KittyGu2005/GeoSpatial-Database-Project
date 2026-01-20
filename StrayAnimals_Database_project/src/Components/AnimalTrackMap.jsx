import React, { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import './AnimalTrackMap.css'; // 引入样式文件

const AnimalTrackMap = () => {
  const cesiumContainer = useRef(null);
  const viewerRef = useRef(null);
  
  // 状态管理
  const [animalList, setAnimalList] = useState([]); // 动物列表
  const [selectedAnimalId, setSelectedAnimalId] = useState(''); // 当前选中的ID

  // 辅助：颜色生成
  const getColorByTime = (index, total) => {
    const ratio = index / total;
    const startColor = new Cesium.Color(1.0, 1.0, 0.5, 1.0); // 浅黄
    const endColor = new Cesium.Color(0.8, 0.0, 0.0, 1.0);   // 深红
    const resultColor = new Cesium.Color();
    Cesium.Color.lerp(startColor, endColor, ratio, resultColor);
    return resultColor;
  };

  // 1. 初始化地图 (只执行一次)
  useEffect(() => {
    if (!cesiumContainer.current) return;

    const viewer = new Cesium.Viewer(cesiumContainer.current, {
      terrainProvider: undefined,
      animation: false,
      timeline: false,
      baseLayerPicker: true,
      geocoder: false,
      homeButton: true,
      sceneModePicker: true,
      navigationHelpButton: false,
      infoBox: true,
      selectionIndicator: false,
    });

    viewer._cesiumWidget._creditContainer.style.display = "none";
    viewerRef.current = viewer;

    // 初始获取所有动物列表，用于填充下拉框
    fetchAnimals();

    return () => {
      viewer.destroy();
    };
  }, []);

  // API: 获取动物列表
  const fetchAnimals = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/animals');
      const data = await response.json();
      setAnimalList(data);
      // 默认选中第一个动物（如果有的话）
      if (data.length > 0) {
        setSelectedAnimalId(data[0].anim_id);
      }
    } catch (error) {
      console.error('获取动物列表失败:', error);
    }
  };

  // 2. 当 selectedAnimalId 改变时，加载对应的轨迹
  useEffect(() => {
    const loadTracks = async () => {
      if (!selectedAnimalId || !viewerRef.current) return;

      const viewer = viewerRef.current;
      
      // 先清除旧的轨迹
      viewer.entities.removeAll();

      try {
        const response = await fetch(`http://localhost:3001/api/map_animal_tracks?anim_id=${selectedAnimalId}`);
        if (!response.ok) throw new Error('轨迹数据加载失败');
        
        const data = await response.json();
        
        if (data.length === 0) {
          alert("该动物暂无轨迹数据");
          return;
        }

        const positions = [];

        data.forEach((point, index) => {
          const lng = parseFloat(point.longitude);
          const lat = parseFloat(point.latitude);
          const timeStr = new Date(point.time).toLocaleString();
          const desc = point.description || '无描述信息';
          const position = Cesium.Cartesian3.fromDegrees(lng, lat, 0);

          positions.push(position);
          const pointColor = getColorByTime(index, data.length);

          // 添加点
          viewer.entities.add({
            name: `${point.name} - 轨迹点`,
            position: position,
            point: {
              pixelSize: 12,
              color: pointColor,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2,
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            },
            // 美丽的内联 HTML 弹窗内容
            description: `
              <div style="padding: 10px; font-family: 'Segoe UI', sans-serif;">
                <p style="margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom:5px;">
                  <strong style="color: #10b981;">记录序号:</strong> <strong style="color: #000000ff;">第 ${index + 1} 点</strong>
                </p>
                <p style="margin-bottom: 8px;">
                  <strong style="color: #10b981;">记录时间:</strong> </strong> <strong style="color: #000000ff;">${timeStr}</strong>
                </p>
                <p style="margin-bottom: 0;">
                  <strong style="color: #10b981;">描述信息:</strong> <strong style="color: #000000ff;">${desc}</strong>
                </p>
              </div>
            `
          });
        });

        // 画线
        if (positions.length > 1) {
          viewer.entities.add({
            polyline: {
              positions: positions,
              width: 4,
              material: new Cesium.Color(0.06, 0.72, 0.5, 0.6), // 半透明绿色线条
              clampToGround: true,
            }
          });
        }

        viewer.zoomTo(viewer.entities);

      } catch (err) {
        console.error("轨迹加载出错:", err);
      }
    };

    loadTracks();
  }, [selectedAnimalId]); // 依赖项：当ID变化时重新执行

  return (
    <div className="animal-track-page">
      {/* 1. 居中大标题 */}
      <h1>AnimalTracksMap</h1>
      
      {/* 4. 选择框区域 */}
      <div className="selector-container">
        <label className="selector-label">选择追踪对象:</label>
        <select 
          className="animal-select"
          value={selectedAnimalId}
          onChange={(e) => setSelectedAnimalId(e.target.value)}
        >
          {animalList.length === 0 && <option>加载中...</option>}
          {animalList.map(animal => (
            <option key={animal.anim_id} value={animal.anim_id}>
              {animal.name} (ID: {animal.anim_id})
            </option>
          ))}
        </select>
      </div>

      {/* 2. 地图容器：宽90%，高70vh */}
      <div className="map-wrapper">
        <div 
          ref={cesiumContainer} 
          style={{ width: '100%', height: '100%' }} 
        />
      </div>
    </div>
  );
};

export default AnimalTrackMap;