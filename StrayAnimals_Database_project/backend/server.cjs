const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 错误捕捉（防止服务器因未捕获异常而挂掉）
process.on('uncaughtException', (err) => {
  console.error('❌ 未捕获的异常:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的 Promise 拒绝:', reason);
});

// ================= 数据库连接配置 =================
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'project_for_demo',
  password: 'postgres', 
  port: 5432,
});

// 测试连接
pool.connect((err, client, release) => {
  if (err) {
    return console.error(`❌ 无法连接到 ${pool.options.database} 数据库`, err.stack);
  }
  console.log(`✅ 已成功连接到现有数据库: ${pool.options.database}`);
  release();
});

// ================= API 接口区域 =================

// 【接口 0】获取当前用户信息
app.get('/api/user', async(req, res) => { 
  const userId = req.query.userId || 1;
  try {
    const sql = `select name from us where us_id = $1`;
    const result = await pool.query(sql, [userId]);
    
    // 🔧 修复：增加空值检查，防止崩溃
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "用户不存在" });
    }
    
    console.log(`当前用户id为 ${userId}，当前用户名为 ${result.rows[0].name}`);
    res.json(result.rows[0]); 
  } catch (err) {
    console.error("❌ 获取用户信息失败:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 【接口 1】获取动物列表
app.get('/api/animals', async (req, res) => {
  try {
    const sql = `
      SELECT 
        anim_id, 
        name, 
        species, 
        breed 
      FROM animal 
    `;
    const result = await pool.query(sql);
    console.log(`📡 [GET /animals] 成功获取 ${result.rows.length} 条数据`);
    res.json(result.rows); 
  } catch (err) {
    console.error("❌ 查询动物出错:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 【接口 2】获取订阅列表 (包含 GIS 函数)
app.get('/api/subscriptions', async (req, res) => {
  const userId = req.query.userId || 1;
  try {
    
    const sql = `
      SELECT 
        s.us_id,
        s.anim_id,
        a.name,
        a.species,
        a.breed,
        a.age, 
        a.fur_color, 
        a.sex, 
        a.status, 
        a.health, 
        a.neutered,
        a.last_time AS recent_discovery_time,
        ST_AsText(ST_SnapToGrid(a.location, 0.01)) AS blurred_location, 
        (CURRENT_TIMESTAMP - s.subs_time) AS subscription_duration, 
        a.last_desc AS recent_description
      FROM subscription s
      JOIN animal a ON s.anim_id = a.anim_id
      WHERE s.us_id = $1
    `;
    const result = await pool.query(sql, [userId]);
    console.log(`📡 [GET /subscriptions] 为用户 ${userId} 获取了 ${result.rows.length} 条订阅`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ 查询订阅出错:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 【接口 3：添加订阅】
app.post('/api/add_subscription', async (req, res) => {
  const { us_id, anim_id } = req.body;

  if (!us_id || !anim_id) {
    return res.status(400).json({ message: "参数缺失：需要 us_id 和 anim_id" });
  }

  try {
    const checkSql = 'SELECT * FROM subscription WHERE us_id = $1 AND anim_id = $2';
    const checkResult = await pool.query(checkSql, [us_id, anim_id]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({ message: "您已经订阅过这只动物了" });
    }

    const insertSql = `
      INSERT INTO subscription (us_id, anim_id, subs_time) 
      VALUES ($1, $2, CURRENT_TIMESTAMP)
    `;
    await pool.query(insertSql, [us_id, anim_id]);

    console.log(`✅ 用户 ${us_id} 成功订阅了动物 ${anim_id}`);
    res.json({ message: "订阅成功" });

  } catch (err) {
    console.error("❌ 订阅接口报错:", err.message);
    res.status(500).json({ message: "服务器内部错误: " + err.message });
  }
});

// 【接口 4：取消订阅】
app.delete('/api/unsubscription/:userId/:animId', async (req, res) => {
  const { userId, animId } = req.params;
  console.log(`🗑️ 收到取消订阅请求: 用户ID=${userId}, 动物ID=${animId}`);

  try {
    const sql = 'DELETE FROM subscription WHERE us_id = $1 AND anim_id = $2';
    const result = await pool.query(sql, [userId, animId]);
    
    if (result.rowCount === 0) {
      console.log('⚠️ 未找到对应记录，可能之前已取消');
      return res.json({ message: "记录不存在或已删除" });
    }

    console.log(`✅ 成功删除订阅`);
    res.json({ message: "取消订阅成功" });

  } catch (err) {
    console.error("❌ 取消订阅失败:", err.message);
    res.status(500).json({ error: "服务器内部错误: " + err.message });
  }
});

// 【接口 5：地图动物点位】
app.get('/api/map_animals', async (req, res) => {
  try {
    const sql=`
      select 
        anim_id,
        name,
        ST_X(ST_Transform(location,4326)) as longitude,
        ST_Y(ST_Transform(location,4326)) as latitude
      from animal
      where location is not null
    `;
    const result = await pool.query(sql);
    console.log(`地图数据加载：找到${result.rows.length}个动物`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ 地图数据加载失败:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 【接口 6：动物轨迹】
app.get('/api/map_animal_tracks', async (req, res) => {
  const anim_id = req.query.anim_id || 1;
  try {
    const sql=`
      select 
        d.anim_id,
        (select name from animal a where a.anim_id = d.anim_id) as name,
        d.time,
        ST_X(ST_Transform(location,4326)) as longitude,
        ST_Y(ST_Transform(location,4326)) as latitude,
        d.description
      from discovery d
      where location is not null and anim_id = $1
      order by time asc
    `;
    const result = await pool.query(sql, [anim_id]);
    console.log(`地图数据加载：找到${result.rows.length}条轨迹`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ 地图数据加载失败:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 【接口 7：添加发现记录】
app.post('/api/add_discovery', async (req, res) => {
  const { us_id, anim_id, description, longitude, latitude } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN'); // 开启事务

    const pointWKT = `POINT(${longitude} ${latitude})`;

    const insertSql = `
      INSERT INTO discovery (us_id, anim_id, description, location, time, is_checked)
      VALUES ($1, $2, $3, ST_GeomFromText($4, 4326), NOW(), 0)
    `;
    await client.query(insertSql, [us_id, anim_id, description, pointWKT]);

    const updateSql = `
      UPDATE animal 
      SET location = ST_GeomFromText($2, 4326),
          last_time = NOW(),
          last_desc = $3
      WHERE anim_id = $1
    `;
    await client.query(updateSql, [anim_id, pointWKT, description]);

    await client.query('COMMIT'); // 提交事务
    res.json({ message: "添加成功并已更新动物状态" });

  } catch (err) {
    await client.query('ROLLBACK'); // 出错回滚
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ================= 启动服务器 =================
const server = app.listen(PORT, () => {
  console.log(`🚀 后端服务已启动: http://localhost:${PORT}`);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`❌ 端口 ${PORT} 被占用！`);
  } else {
    console.error('❌ 服务器错误:', e);
  }
});