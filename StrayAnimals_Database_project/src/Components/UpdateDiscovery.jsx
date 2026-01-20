import React, { useState, useEffect } from 'react';
import './AddDiscovery.css'; 
// ✅ 修正 1: 统一使用 import 导入 JSON 数据，去掉原来的 require
import geoData from '../assets/zju_building_poi.json';

const AddDiscovery = () => {
  // 1. 基础状态
  const [animals, setAnimals] = useState([]);
  const [selectedAnimId, setSelectedAnimId] = useState('');
  const [description, setDescription] = useState('');
  
  // 2. POI 搜索状态
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 模拟当前用户 ID
  const currentUserId = 1; 

  // 获取动物列表
  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/animals');
        const data = await res.json();
        setAnimals(data);
        // 如果有数据，默认选中第一个，防止用户直接提交空ID
        if (data.length > 0) {
          setSelectedAnimId(data[0].anim_id);
        }
      } catch (err) {
        console.error('获取动物列表失败', err);
      }
    };
    fetchAnimals();
  }, []);

  // 处理 POI 搜索 (只筛选 Point 类型)
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedPoi(null); // 用户重新输入时，清除已选坐标

    if (value.trim().length > 0) {
      const lowerValue = value.toLowerCase(); // ✅ 优化：转小写用于搜索
      
      const filtered = geoData.features.filter(feature => {
        // 核心过滤逻辑：
        // 1. 必须是 Point 类型
        // 2. 必须有 name 属性
        // 3. name 包含搜索关键词 (忽略大小写)
        const isPoint = feature.geometry && feature.geometry.type === 'Point';
        const hasName = feature.properties && feature.properties.name;
        
        if (isPoint && hasName) {
            return feature.properties.name.toLowerCase().includes(lowerValue);
        }
        return false;
      });
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // 选择 POI
  const handleSelectPoi = (feature) => {
    setSearchTerm(feature.properties.name);
    setSelectedPoi(feature);
    setShowSuggestions(false);
  };

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ 安全检查：确保选择了动物
    if (!selectedAnimId) {
        alert("请等待动物列表加载或刷新页面！");
        return;
    }

    if (!selectedPoi) {
      alert("请从下拉列表中选择一个有效的地点！");
      return;
    }

    // 提取坐标：Point 类型的 coordinates 是 [lng, lat]
    const [longitude, latitude] = selectedPoi.geometry.coordinates;

    const payload = {
      us_id: currentUserId,
      anim_id: selectedAnimId,
      description: description,
      longitude: longitude,
      latitude: latitude
    };

    try {
      const response = await fetch('http://localhost:3001/api/add_discovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("🎉 发现记录上传成功！感谢您的贡献。");
        // 重置表单
        setDescription('');
        setSearchTerm('');
        setSelectedPoi(null);
      } else {
        // 尝试获取后端返回的具体错误信息
        const errData = await response.json();
        alert(`上传失败: ${errData.message || '服务器错误'}`);
      }
    } catch (error) {
      console.error("提交出错:", error);
      alert("提交出错，请检查网络连接");
    }
  };

  return (
    <div className="discovery-page">
      <div className="discovery-card">
        <h2>上传新发现</h2>
        
        <form onSubmit={handleSubmit}>
          {/* 动物选择 */}
          <div className="form-group">
            <label>观察到的动物</label>
            <select 
              className="form-control"
              value={selectedAnimId}
              onChange={(e) => setSelectedAnimId(e.target.value)}
            >
              {/* ✅ 增加一个 loading 状态或者提示 */}
              {animals.length === 0 && <option value="">加载中...</option>}
              
              {animals.map(anim => (
                <option key={anim.anim_id} value={anim.anim_id}>
                  {anim.name} (ID: {anim.anim_id})
                </option>
              ))}
            </select>
          </div>

          {/* POI 搜索 (仅 Point) */}
          <div className="form-group">
            <label>发现地点 (搜索附近地标)</label>
            <input 
              type="text"
              className="form-control"
              placeholder="输入地点名称，如 '南华园'..."
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
              // 延迟关闭以便点击事件生效
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            
            {/* 选中后的坐标提示 */}
            {selectedPoi && (
              <div className="coordinates-display">
                📍 坐标已锁定: {selectedPoi.geometry.coordinates[0].toFixed(6)}, {selectedPoi.geometry.coordinates[1].toFixed(6)}
              </div>
            )}

            {/* 下拉建议 */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.map((feature, index) => (
                  <div 
                    // 使用 feature.id 作为 key，如果没有则用 index
                    key={feature.id || index} 
                    className="suggestion-item"
                    // 使用 onMouseDown 而不是 onClick，因为 onMouseDown 发生在 Input onBlur 之前
                    // 这样可以避免 setTimeout 的 Hack，不过为了兼容性，保留 onClick 也可以
                    onClick={() => handleSelectPoi(feature)}
                  >
                    <span className="suggestion-name">{feature.properties.name}</span>
                    <span className="suggestion-detail">
                        {feature.properties.building ? `建筑` : '地标'} 
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 描述 */}
          <div className="form-group">
            <label>现场描述</label>
            <textarea 
              className="form-control"
              placeholder="例如：看到它在草地上睡觉，看起来很健康..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* 提交按钮 */}
          <button 
            type="submit" 
            className="submit-btn"
            disabled={!selectedPoi} // 没有选地点时禁用
          >
            发布发现
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDiscovery;