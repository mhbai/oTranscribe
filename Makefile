build_dev:
	$(MAKE) compile_static

	# empty manifest
	cp src/manifest-dev.appcache dist/manifest.appcache
	echo "# Updated $(shell date +%x_%H:%M:%S:%N)" >> dist/manifest.appcache
	
	# run webpack
	./node_modules/webpack/bin/webpack.js --watch -d

compile_static:
	# clear out existing dist folder
	rm -rf ./dist
	mkdir ./dist

	# compile l10n files
	for f in src/l10n/*.ini; do (cat "$${f}"; echo) >> dist/data.ini; done
	
	# generate l10n file for local access
	echo "dataIniLines = function(){/*--keep this line--" > dist/data.ini.js
	cat dist/data.ini >> dist/data.ini.js
	echo "-----*/}.toString().replace(/\\\r/g,\"\").slice(\"function(){/*--keep this line--\".length+1,-9);" >> dist/data.ini.js

	
	# copy over static assets
	cp -r src/img src/opensource.htm src/help.htm src/privacy.htm dist/
	cp ./node_modules/jakecache/dist/jakecache.js ./node_modules/jakecache/dist/jakecache-sw.js dist/
	mkdir dist/help
	mv dist/help.htm dist/help/index.html	
	mkdir dist/privacy
	mv dist/privacy.htm dist/privacy/index.html

build_prod:
	$(MAKE) compile_static

	# manifest
	cp -r src/manifest.appcache dist/
	echo "# Updated $(shell date +%x_%H:%M:%S:%N)" >> dist/manifest.appcache
	
	# run webpack
	./node_modules/webpack/bin/webpack.js -p
	
	#overwrite the file from webpack
	cp -r src/js/webL10n/l10n-for-local.js dist/l10n.js
