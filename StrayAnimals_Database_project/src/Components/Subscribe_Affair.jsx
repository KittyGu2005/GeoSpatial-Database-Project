import React, { useState, useEffect } from 'react';
import './AnimalSubscription.css'; // 样式文件

const AnimalSubscription = () => {
  const [animals, setAnimals] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(1); // 模拟当前用户ID，实际项目中应从登录状态获取
  const [username, setUsername] = useState('用户1'); // 模拟用户名

  // 模拟API调用函数
  const fetchAnimals = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/animals');
      const data = await response.json();
      
      setAnimals(data);
    } catch (error) {
      console.error('获取动物列表失败:', error);
    }
  };

  fetch(`http://localhost:3001/api/user?userId=${userId}`)
  .then(res => res.json())
  .then(data => {
    console.log(data);        
    setUsername(data.name); 
  })
  .catch(err => {
    console.error('获取用户失败', err);
  });

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/subscriptions`);
      const data = await response.json();
      
      setSubscriptions(data);
      setUserSubscriptions(data.filter(sub => sub.us_id === userId));
    } catch (error) {
      console.error('获取订阅列表失败:', error);
    }
  };

  const subscribeAnimal = async (animId) => {
    try {
      // 1. 发送真实请求给后端
      const response = await fetch('http://localhost:3001/api/add_subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          us_id: userId,
          anim_id: animId
        })
      });

      // 2. 【关键】检查后端是否报错
      // 如果后端返回 400 (已订阅) 或 500 (服务器错误)，这里会拦截
      if (!response.ok) {
        // 尝试获取后端返回的错误信息（比如 "已经订阅过了"）
        const errorData = await response.json(); 
        throw new Error(errorData.message || '服务器请求失败');
      }
      
      // 3. 【核心修改】订阅成功后，不需要手动捏造数据了！
      // 直接重新调用获取列表的函数，让后端把最新的、包含详细信息的列表发过来
      // 这样就能利用你在后端写的 SQL JOIN 逻辑
      await fetchSubscriptions(); 
      
      alert('成功订阅！');

    } catch (error) {
      console.error('订阅操作失败:', error);
      // alert 显示具体的错误信息
      alert(`订阅失败: ${error.message}`);
    }
  };

  const unsubscribeAnimal = async (animId) => {
    try {
      // 1. ✅ 解除注释，发送真实的 DELETE 请求给后端
      // 注意：URL 格式必须和你后端 server.js 里的路由 '/api/subscription/:userId/:animId' 保持一致
      const response = await fetch(`http://localhost:3001/api/unsubscription/${userId}/${animId}`, {
        method: 'DELETE'
      });
      
      // 2. ✅ 检查后端是否操作成功
      if (!response.ok) {
        throw new Error('服务器删除失败');
      }

      // 3. ✅ 成功后，重新获取最新的订阅列表
      // 这样前端页面就会自动把刚才删除的那一项去掉，保持和数据库同步
      await fetchSubscriptions();
      
      alert('已取消订阅');
    } catch (error) {
      console.error('取消订阅失败:', error);
      alert('取消订阅失败，请重试');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAnimals(), fetchSubscriptions()]);
      setLoading(false);
    };

    loadData();
  }, [userId]);

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="animal-subscription-container">
      <h1>动物订阅系统</h1>
      
      {/* 用户信息 */}
      <div className="user-info">
        <h2>当前用户: 用户 {username}</h2>
      </div>

      {/* 可订阅动物列表 */}
      <div className="section">
        <h2>可订阅动物</h2>
        <div className="animals-grid">
          {animals.map(animal => {
            const isSubscribed = userSubscriptions.some(sub => sub.anim_id === animal.anim_id);
            return (
              <div key={animal.anim_id} className="animal-card">
                <h3>{animal.name}</h3>
                <p><strong>种类:</strong> {animal.species}</p>
                <p><strong>品种:</strong> {animal.breed}</p>
                <button 
                  className={`subscribe-btn ${isSubscribed ? 'unsubscribe' : 'subscribe'}`}
                  onClick={() => isSubscribed 
                    ? unsubscribeAnimal(animal.anim_id) 
                    : subscribeAnimal(animal.anim_id)
                  }
                  disabled={isSubscribed && loading}
                >
                  {isSubscribed ? '取消订阅' : '订阅'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 我的订阅列表 */}
      <div className="section">
        <h2>我的订阅列表</h2>
        {userSubscriptions.length === 0 ? (
          <p>您还没有订阅任何动物</p>
        ) : (
          <div className="subscriptions-list">
            {userSubscriptions.map(sub => (
              <div key={`${sub.us_id}-${sub.anim_id}`} className="subscription-card">
                <div className="subscription-info">
                  <h3>{sub.name}</h3>
                  <p><strong>种类:</strong> {sub.species}</p>
                  <p><strong>品种:</strong> {sub.breed}</p>
                  <p><strong>年龄:</strong> {sub.age}岁</p>
                  <p><strong>毛色:</strong> {sub.fur_color}</p>
                  <p><strong>性别:</strong> {sub.sex}</p>
                  <p><strong>状态:</strong> {sub.status}</p>
                  <p><strong>健康状况:</strong> {sub.health === 1 ? '健康' : '不健康'}</p>
                  <p><strong>绝育情况:</strong> {sub.neutered === 1 ? '已绝育' : '未绝育'}</p>
                  <p><strong>最后发现时间:</strong> {sub.recent_discovery_time}</p>
                  <p><strong>描述:</strong> {sub.recent_description}</p>
                </div>
                <button 
                  className="unsubscribe-btn"
                  onClick={() => unsubscribeAnimal(sub.anim_id)}
                >
                  取消订阅
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimalSubscription;