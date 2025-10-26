成功編譯的方法：

1. npm, nodejs 降版：
```
$ nvm install 14.21.3
$ nvm use 14.21.3
$ node --version
v14.21.3
$ npm install -g npm@6
$ npm --version
v14.21.3
```

2. 安裝：
```
$ npm install
$ make build_prod
```

3. 步署：
```
$ cp -r dist ../
$ git checkout --orphan gh-pages
$ git rm -rf .
$ cp -r ../dist/* .
$ git add .
$ git commit -m "Initial gh-pages commit" 
$ git push origin gh-pages
$ git checkout main
```
