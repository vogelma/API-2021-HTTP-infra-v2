FROM php:7.2-apache

COPY apache2-foreground /usr/local/bin/
COPY template /var/apache2/template
COPY conf/ /etc/apache2

RUN a2enmod proxy proxy_http
RUN a2ensite 000-* 001-*