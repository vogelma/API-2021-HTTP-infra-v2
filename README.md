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

Pour cette partie nous allons réutilisé les containers créés dans les deux premières partie. Pour commencer il faut trouver l'adresse ip de chacun avec
la commande donné dans le webcast:

    docker inspect nameContainer | grep -i ipaddr

Pour notre infrastructure nous trouvé les adresses:

ip pour le container php-web-static: 172.17.0.3

ip pour le container js-web-dynamic: 172.17.0.2

La config pour les sites sont diponible dans le fichier conf/sites-available/001-reverse-proxy.conf. Le site statique est à la racine du site et le site dynamique avec le flux json est à l'adresse /api/students/.

Nous utilisé la même image de base que pour la partie 1 mais nous mettons les fichiers dans le dossier d'Apache. Nous activons deux plugins puis nous activons notre site.

    FROM php:7.2-apache

    COPY conf/ /etc/apache2

    RUN a2enmod proxy proxy_http
    RUN a2ensite 000-* 001-*

Sous Debian 11 il faut utiliser localhost pour mapper le domaine dans le fichier /etc/hosts. Nous avons utilisé demo.api.ch pour le nom de domaine.

    127.0.0.1 demo.api.ch

Une fois que le reverse proxy est configuré il n'y a plus besoin de mapper les ports car apache s'occupe de le rediriger en sortant du docker.

    docker run -d --name api-static api-static
    docker run -d --name api-dynamic api-dynamic

    docker build -t api-rp .
    docker run -p 8080:80 -d --name api-rp api-rp

Maintenant les deux sites sont visibles à l'adresse http://demo.api.ch:8080 et http://demo.api.ch:8080/api/students

# Partie 4 ajax

Dans cette partie nous allons rajouté un script qui fera des requêtes pour afficher sur la page web les animaux colorés à adopter.
Ce script prend le premier animal du flux JSON pour l'afficher dans une balise span html avec le nom de class skills. Il renouvelle cet animal toutes les 2 secondes.
Le nom du script doit être placé en bas de la page html dans des balises script.



# Partie 5 configuration dynamique du reverse proxy

Cette partie permet plus de flexibilté car l'adresse ip des deux containers est mis au moment de lancer le reverse proxy et non plus dans des fichiers de configuration.

Nous utilisons -e pour mettre des arguments qui sont des valeurs de variables que le script php récupére pour mettre le fichier de configuration.

Le script apache2-foreground se lance au démarrage du container. C'est lui qui met le résulat du script php dans le fichie de configuration du reverse proxy. Après cela il faut relancer apache2 pour prendre en compte les modifications. Nous avons utilisé service au lieu de ce qui était présenter dans la vidéo car plus simple d'utilisation.  

    docker run -e STATIC_APP = 172.17.0.3 -e DYNAMIC_APP=172.17.0.2 --name apache-rp -p 8080:80 api-rp

Pour le moment cette partie n'est fonctionnelle qui si nous lançons en interactif le container car sinon il s'éteint de suite. Le problème est inconnu car si nous ne lancons pas en background le container le statut de apache2 est bien running mais docker ps montre que le container est éteint.
