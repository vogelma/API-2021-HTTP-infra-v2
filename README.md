# Aide-mémoire

## Docker

Build une image en lui donnant un nom

    docker build -t nameImage .

Run un container en mappant le port 80 sur le port de sortie 8080 et en donnant un nom au container

    docker run -p 8080:80 --name nameContainer nameImage

Trouver l'adresse ip d'un container

    docker inspect nameContainer | grep -i ipaddr


## Git

Création d'une nouvelle branche

    git checkout -b newBranch

Nom des branches utilisées dans ce projet

    main
    fb-apache-static
    fb-express-dynamic
    fb-apache-reverse-proxy
    fb-ajax-jquery
    fb-dynamic-configuration
    
    
    
   

# Partie 1 apache web static

Pour cette première partie il était nécessaire de créer un site web static. Nous avons utilisé un template de bootstrap pour avoir une interface user-friendly.
Nous voulions ensuite que le site soit accesible en localhost pour cela nous nous sommes aidé de Docker qui fournit une image php avec apache intégré.
En lisant la documentaton nous apercevons qu'il faut placer notre site dans le dossier /var/www/html de l'image. La ligne COPY du Dockerfile s'en occupe.

    FROM php:7.2-apache

    COPY src/ /var/www/html/

Finalement il faut build puis run le container pour voir notre site à l'adresse http://localhost:8080

    docker build -t api-static .
    docker run -p 8080:80 -d --name api-static api-static

# Partie 2 express web dynamic

Pour cette deuxième partie nous avons besoin d'un image node pour faire fonctionner un script Javascript. La documentation demande de placer le script dans 
le dossier /opt/app ce que fait la COPY du Dockerfile une fois encore. La ligne CMD permet d'exécuter le script.

    FROM node:16.13
    COPY src/ /opt/app
    CMD ["node", "/opt/app/index.js"]

Notre script génére un liste d'animaux colorés à adopter. La couleur pourrait être récupéré pour être affiché mais par manque de temps nous n'avons pas pû le faire.
La liste est renouvelé à chaque rafraîchissement de page.

Finalement il faut build puis run le container pour voir notre site à l'adresse http://localhost:9090

    docker build -t api-dynamic .
    docker run -p 9090:3000 -d --name api-dynamic api-dynamic

# Partie 3 reverse proxy

ip pour le container php-web-static: 172.17.0.3

ip pour le container js-web-dynamic: 172.17.0.2

La config pour les sites sont diponible dans le fichier conf/sites-available/001-reverse-proxy.conf. Le site statique est à la racine du site et le site dynamique avec le flux json est à l'adresse /api/students/


    FROM php:7.2-apache

    COPY conf/ /etc/apache2

    RUN a2enmod proxy proxy_http
    RUN a2ensite 000-* 001-*

Sous Debian 11 il faut utiliser localhost pour mapper le domaine. Nous avons utilisé demo.api.ch pour le nom de domaine.

    127.0.0.1 demo.api.ch


Une fois que le reverse proxy est configuré il n'y a plus besoin de mapper les ports car apache s'occupe de le rediriger en sortant du docker.

    docker run -d --name api-static api-static
    docker run -d --name api-dynamic api-dynamic

    docker rm api-rp
    docker run -p 8080:80 -d --name api-rp api-rp


# Partie 5 configuration dynamique du reverse proxy



Utiliser -e pour mettre des arguments plus précisement des valeurs de variables.

    docker run -e STATIC_APP = 172.17.0.3 -e DYNAMIC_APP=172.17.0.2 --name apache-rp -p 8080:80 api-rp
