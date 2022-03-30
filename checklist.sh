#!/bin/bash

# clean folder
rm -rf temp-check
mkdir temp-check

# check cron
echo "[CRONJOB RESTARTER]"
if sudo grep -Fxq "* 18 14 * * /bin/bash vp-restart.sh > /dev/null" /var/spool/cron/crontabs/ubuntu > /dev/null
then
  echo "Every 14th: Ok"
else
  echo "Every 14th: NOT FOUND"
fi

if sudo grep -Fxq "* 18 27 * * /bin/bash vp-restart.sh > /dev/null" /var/spool/cron/crontabs/ubuntu > /dev/null
then
  echo "Every 28th: Ok"
else
  echo "Every 28th: NOT FOUND"
fi
echo "---------------------"

echo "[NGINX CONFIG]"
sudo docker exec voiceping_vp-nginx_1 cat /etc/nginx/nginx.conf > temp-check/nginx.conf
if sudo grep -Fq "worker_rlimit_nofile 65535;" temp-check/nginx.conf > /dev/null
then
  echo "worker_rlimit_nofile 65535: Ok"
else
  echo "worker_rlimit_nofile 65535: NOT FOUND"
fi

if sudo grep -Fq "keepalive_timeout 300;" temp-check/nginx.conf > /dev/null
then
  echo "keepalive_timeout 300: Ok"
else
  echo "keepalive_timeout 300: NOT FOUND"
fi

if sudo grep -Fq "proxy_connect_timeout   3600" temp-check/nginx.conf > /dev/null
then
  echo "proxy_connect_timeout 3600: Ok"
else
  echo "proxy_connect_timeout 3600: NOT FOUND"
fi

if sudo grep -Fq "proxy_send_timeout      3600" temp-check/nginx.conf > /dev/null
then
  echo "proxy_send_timeout 3600: Ok"
else
  echo "proxy_send_timeout 3600: NOT FOUND"
fi

if sudo grep -Fq "proxy_read_timeout      3600" temp-check/nginx.conf > /dev/null
then
  echo "proxy_read_timeout 3600: Ok"
else
  echo "proxy_read_timeout 3600: NOT FOUND"
fi
echo "---------------------"

echo "[DOCKER LOG ROTATE]"
sudo docker inspect --format={{.HostConfig.LogConfig}} voiceping_vp-nginx_1 > temp-check/voiceping_vp-nginx_1.logconfig.txt
if sudo grep -Fq "json-file" temp-check/voiceping_vp-nginx_1.logconfig.txt > /dev/null
then
  echo "json-file: Ok"
else
  echo "json-file: NOT FOUND"
fi

if sudo grep -Fq "max-file:2" temp-check/voiceping_vp-nginx_1.logconfig.txt > /dev/null
then
  echo "max-file 2: Ok"
else
  echo "max-file 2: NOT FOUND"
fi

if sudo grep -Fq "max-size:100m" temp-check/voiceping_vp-nginx_1.logconfig.txt > /dev/null
then
  echo "max-size 100m: Ok"
else
  echo "max-size 100m: NOT FOUND"
fi
echo "---------------------"


echo "[SERVER LOG ROTATE]"
sudo cat /etc/logrotate.d/rsyslog > temp-check/rsyslog
if sudo grep -Fq "rotate" temp-check/rsyslog > /dev/null
then
  echo "rotate: Ok"
else
  echo "rotate: NOT FOUND"
fi

if sudo grep -Fq "compress" temp-check/rsyslog > /dev/null
then
  echo "compress: Ok"
else
  echo "compress: NOT FOUND"
fi

if sudo grep -Fq "delaycompress" temp-check/rsyslog > /dev/null
then
  echo "delaycompress: Ok"
else
  echo "delaycompress: NOT FOUND"
fi

if sudo grep -Fq "size 100M" temp-check/rsyslog > /dev/null
then
  echo "size 100M: Ok"
else
  echo "size 100M: NOT FOUND"
fi
echo "---------------------"