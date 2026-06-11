@echo off
chcp 65001 >nul
echo ========================================
echo   Vector Field Lab — 局域网分享工具箱
echo ========================================
echo.
echo 本脚本需 [以管理员身份运行] 才能添加防火墙规则。
echo 如果不想提权，可以用 SSH 隧道方案（见下方）。
echo.
echo ── 选项 ──
echo   [1] 添加防火墙规则（端口 4173 入站放行）
echo   [2] 移除防火墙规则
echo   [3] 查看当前规则
echo   [X] 退出
echo.
choice /c 123X /n /m "请选择: "

if errorlevel 4 goto :eof
if errorlevel 3 goto :show
if errorlevel 2 goto :remove
if errorlevel 1 goto :add

:add
echo.
netsh advfirewall firewall add rule name="Vite Dev Server (Vector Field Lab)" dir=in action=allow protocol=TCP localport=4173
if %errorlevel% equ 0 (
    echo [OK] 规则添加成功！
    echo.
    echo 本机 IP 地址：
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4" ^| findstr /v "172."') do echo   http:%%a:4173/
    echo.
    echo 启动服务: npm run dev:lan    （开发模式）
    echo          npm run preview:lan （生产预览，需先 npm run build）
) else (
    echo [FAIL] 添加失败 — 请确认是否以管理员身份运行。
)
pause
goto :eof

:remove
echo.
netsh advfirewall firewall delete rule name="Vite Dev Server (Vector Field Lab)"
if %errorlevel% equ 0 (
    echo [OK] 规则已移除。
) else (
    echo [FAIL] 移除失败或规则不存在。
)
pause
goto :eof

:show
echo.
netsh advfirewall firewall show rule name="Vite Dev Server (Vector Field Lab)"
pause
goto :eof
