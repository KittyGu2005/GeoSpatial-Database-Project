<h1>网站开发指南</h1>
1. 请在你的pgAdmin中创建数据库，并将backend/server.cjs文件中的数据库相关信息修改为你的数据库信息。
   
```javascript
const pool = new Pool({
  user: 'postgres', //请改为你的用户名
  host: 'localhost', //请改为你的数据库服务器地址
  database: 'project_for_demo', //请改为你的数据库名称
  password: 'postgres',  //请改为你的密码
  port: 5432,
});
```

2. 打开backend/test_for_fronted.ipynb，将`%%sql postgresql://postgres:postgres@localhost:5432/project_for_demo`中的数据库信息改为你的。自行配置运行该ipynb文件所需的虚拟环境与包，运行所有代码构建数据库并生成测试数据。
   
3. 命令行输入`node server.cjs`，运行backend/server.cjs，启动后端服务。

4. 命令行输入`npm install`或者`pnpm install`下载需要的node_modules；命令行输入`npm run dev`，运行frontend/src/main.jsx，启动前端服务。

5. 浏览器访问`http://localhost:5173/`，即可进入网站。

