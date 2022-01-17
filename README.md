# Aide-mémoire

## Docker

Build une image en lui donnant le nom nameImage

    docker build -t nameImage .

Run un container en arrière plan, en mappant le port 80 du container sur le port 8080 de l'hôte, et en donnant le nom nameContainer au container

    docker run -d -p 8080:80 --name nameContainer nameImage

Trouver l'adresse ip du container nameContainer

    docker inspect nameContainer | grep -i ipaddr


## Git

Création d'une nouvelle branche newBranch

    git checkout -b newBranch

Nom des branches utilisées dans ce projet

    main
    fb-apache-static
    fb-express-dynamic
    fb-apache-reverse-proxy
    fb-ajax-jquery
    fb-dynamic-configuration
    fb-traefik
    
    
# Pré-avis

Nous avons décidé de faire un repo chacune et de travailler chacune sur le sien en parallèle pour être sûre de bien comprendre la matière de ce cours. Ce repo est celui de Maëlle Vogel. Celui de Mélissa Gehring est visible à l'adresse: [https://github.com/Lollipoke/API-2021-HTTP-Infrastructure](https://github.com/Lollipoke/API-2021-HTTP-Infrastructure). Nous avons décidé arbitrairement d'ajouter notre rapport sur ce repo-là (celui de Maëlle Vogel), et c'est également celui-là que nous soumettons pour la note.
   

# Architecture du repo

La branche main contient uniquement le fichier README.md, et nous avons ensuite créé une nouvelle branche pour chaque nouvelle partie. Chaque checkout a été fait à partir de la branche actuelle, et non pas à partir de la branche main, de sorte que la branche de la partie n+1 contient également le travail réalisé dans la partie n.
Les fichiers nécessaires aux 3 principales images sont séparés en 3 dossiers, stockés dans le dossier docker_images.


# Partie 1 : Serveur HTTP statique avec apache httpd (fb-apache-static)

Pour cette première partie il nous était demandé de créer un site web static. Pour le contenu de notre page web, nous avons utilisé un template de bootstrap pour avoir une interface user-friendly.
Afin de lancer un serveur HTTP générant notre page statique à partir du contenu de notre template, accessible en localhost, nous avons utilisé l'image docker officielle php avec apache intégré.
La documentation de l'image officielle php nous indique le contenu à insérer dans le Dockerfile :

    FROM php:7.2-apache

    COPY src/ /var/www/html/

Nous observons que le contenu du dossier src/ est copié à l'emplacement /var/www/html/, car c'est à cet endroit que se situe l'arborescence de notre file system HTML dans l'image Docker. Nous avons donc naturellement inséré notre template dans notre dossier src/ local qui se situe au même niveau que le Dockerfile, afin qu'il soit copié au bon endroit au moment de la création de l'image.

Finalement, nous pouvons build notre image :

    docker build -t api/api-static .

Puis run le container :

    docker run -p 8080:80 -d --name api-static api/api-static    

Pour voir notre site à l'adresse [http://localhost:8080](http://localhost:8080)

Note : en exécutant la commande /bin/bash sur notre container api-static en train de tourner, nous pouvons aller observer les fichiers de configuration du serveur apache. Ils se trouvent dans le dossier /etc/apache2/. On y trouve, entre autres, le fichier de configuration principal apache2.conf, ou encore la liste des fichiers de configuration pour plusieurs sites potentiels, situés dans le dossier sites-available. Cela nous sera utile pour les étapes ultérieures.


# Partie 2 : Serveur HTTP dynamique avec express.js (fb-express-dynamic)

Pour cette deuxième partie nous avons utilisé l'image Docker node.js officielle pour run un script Javascript. La documentation officielle nous indique quoi mettre dans le Dockerfile : 

    FROM node:16.13
    COPY src/ /opt/app
    CMD ["node", "/opt/app/index.js"]

A nouveau nous pouvons observer que le contenu du dossier local src/ est copié dans le dossier /opt/app de notre image. 

Nous avons exécuté dans notre dossier local src les commandes suivantes :

    npm init
    npm install --save chance
    npm install --save express
    
Afin d'obtenir les fichiers nécessaires au démarrage d'une nouvelle application node.js, ainsi que les modules Chance (pour la génération aléatoire d'animaux et de couleurs), et Express.js (pour la création d'une application HTTP)

Notre script index.js génère, à l'aide du module Chance, un liste d'animaux et de couleurs à adopter. La couleur pourra être récupérée dans les étapes ultérieures pour influencer la couleur du texte de l'animal. Nous avons également lancé une application HTTP à l'aide du framework Express.js qui se connecte au port 3000 et qui renvoie au client les paires d'animaux colorés générées.
La liste est renouvelée à chaque rafraîchissement de page.

La dernière ligne du Dockerfile, CMD, permet d'exécuter la commande node au lancement d'un container. Dans ce cas-ci, cela va exécuter le script 'index.js' situé dans le dossier /opt/app.
   
Finalement, nous pouvons build notre image :

    docker build -t api/api-dynamic .

Puis run le container :

    docker run -p 9090:3000 -d --name api-dynamic api/api-dynamic    

Pour voir notre site à l'adresse [http://localhost:9090](http://localhost:9090)

# Partie 3 : Reverse proxy avec apache, configuration statique (fb-apache-reverse-proxy)

Pour cette partie nous allons réutiliser les images créées dans les deux premières parties pour nos deux services, et ajouter un reverse proxy réalisé à l'aide d'un serveur apache afin de centraliser nos requêtes. 
Tout d'abord il nous faut relancer deux containers, un pour chacun de nos service, en prenant soin de ne PAS les mapper vers l'extérieur avec l'option -p. L'intérêt du reverse proxy est justement de gérer les requêtes vers les différents services en interne. 
Un fois nos containers lancés à l'aide de :

    docker run -d --name api-static api/api-static 
    docker run -d --name api-dynamic api/api-dynamic 
    
Nous avons pu trouver l'adresse ip de chacun avec la commande donnée dans le webcast:

    docker inspect nameContainer | grep -i ipaddr

Pour notre infrastructure nous avons trouvé les adresses:

    ip pour le container api-static: 172.17.0.2
    ip pour le container api-dynamic: 172.17.0.3

Maintenant que nous avons nos deux services, il nous faut configurer le reverse-proxy. Pour cela nous avons utilisé la même image Docker php avec apache que dans la partie 1, et nous avons remplacé dans le Dockerfile la copie du dossier src/ contenant le template de la page web statique par la copie du dossier conf/ qui contient les fichiers de configuration du reverse proxy. 

    FROM php:7.2-apache

    COPY conf/ /etc/apache2

    RUN a2enmod proxy proxy_http
    RUN a2ensite 000-* 001-*

Comme mentionné dans la partie 1, ces fichiers de configuration se trouvent dans l'image dans le dossier /etc/apache2. 

Nous avons rédigé le fichier de configuration en local dans le dossier conf. La config pour le reverse-proxy est diponible dans le fichier conf/sites-available/001-reverse-proxy.conf. Nous précisons que l'Host doit être demo.api.ch à l'aide de ServerName, puis à l'aide des commandes ProxyPass et ProxyPassReverse, nous indiquons à notre proxy que le site statique (adresse ip 172.0.7.2:80) est à la racine du site, "/", et que le site dynamique avec le flux json (adresse ip 172.0.7.3:3000) est à l'adresse "/pets/".

Nous avons également fourni un site par défaut, décrit par le fichier de configuration 000-default.conf. Il est important de fournir un site par défaut, afin de rerouter les demandes qui ne précisent pas de Host vers ce dernier. Sinon, les demandes sans Host seraient aussi redirigées vers notre reverse-proxy, or nous voulons uniquement les demandes adressées au Host demo.api.ch.

Les deux dernières commandes du Dockerfile permettent d'activer les modules proxy et proxy_http, afin de permettre l'utilisation de ProxyPass et ProxyPassReverse, puis d'activer les deux sites décrits dans les fichiers de configuration ci-dessus, afin qu'ils se retrouvent dans le dossier /etc/apache2/sites-enabled.

Pour pouvoir tester notre infrastructure sur un navigateur web, il faut faire en sorte que le navigateur envoie le bon Host dans la requête. Pour cela il faut configurer le DNS. Sous Debian 11 il faut mapper localhost vers le Host, ici demo.api.ch, dans le fichier /etc/hosts. Sous Windows, il faut modifier le fichier C:\Windows\System32\drivers\etc\hosts.

    127.0.0.1 demo.api.ch
    
Une fois que nous avons fait tous ces ajouts, nous pouvons créer l'image api/api-rp en allant nous placer dans le dossier docker-files/apache-reverse-proxy/ et en lançant la commande :

    docker build -t api/api-rp .

Une fois que le reverse proxy est configuré il n'y a plus besoin de mapper les ports pour les services, comme mentionné plus haut, car apache s'occupe de le rediriger en sortant du docker. En démarrant la procédure de 0, sans aucun container en cours d'exécution, les commandes suivantes permettent de mettre en place les 2 containers de services ainsi que le reverse-proxy :

    docker run -d --name api-static api/api-static
    docker run -d --name api-dynamic api/api-dynamic
    docker run -p 8080:80 -d --name api-rp api/api-rp

Maintenant les deux sites sont visibles aux adresses [http://demo.api.ch:8080](http://demo.api.ch:8080) et [http://demo.api.ch:8080/pets/](http://demo.api.ch:8080/pets/)

Note : Ce setup est très fragile car les adresses IP sont hardcodées dans le fichier de configuration, et il faut toujours s'assurer de démarrer la procédure avec aucun container en cours d'exécution, et d'exécuter les commander run dans le bon ordre.

# Partie 4 : Requêtes AJAX avec JQuery (fb-ajax-jquery)

Pour faire nos requêtes AJAX, nous avons utilisé la librairie Javascript JQuery. Depuis notre browser, on envoie des requêtes (AJAX) en arrière-plan au serveur dynamique pour récupérer des données : les paires d'animaux colorés. A partir de ces données on va mettre à jour notre site web statique afin d'afficher le nom du premier animal dans la couleur correspondante, si la requête nous renvoie au moins une paire d'animaux colorés.

Dans cette partie nous avons donc modifié le dossier src de notre partie 1, pour y ajouter un script Javascript qui fera les requêtes mentionnées ci-dessus. Il prend le premier animal du flux JSON (du site dynamique réalisé à la partie 2 qui se trouve à l'adresse /pets/) pour l'afficher dans une balise span HTML avec le nom de class pets que nous avons ajoutée pour le bien de notre démo dans le fichier index.html. Le nom de l'animal est affiché dans sa couleur. Le script refait une nouvelle requête automatiqmenet toutes les 2 secondes.
Le nom du script doit également être ajouté en bas de la page HTML index.html dans des balises script :

    <script src="pets.js"></script>
    
Une fois que nous avons fait tous ces ajouts, nous pouvons recréer l'image api/api-static en allant nous placer dans le dossier docker-files/apache-php-image/ et en lançant la commande :

    docker build -t api/api-static .

Finalement, de manière similaire à la partie 3, nous pouvons tester notre infrastructure en suivant la procédure suivante, en assumant qu'aucun container n'est en cours d'exécution :
    
    docker run -d --name api-static api/api-static
    docker run -d --name api-dynamic api/api-dynamic
    docker run -p 8080:80 -d --name api-rp api/api-rp
    
Et nous pouvons admirer le resultat à l'adresse [http://demo.api.ch:8080](http://demo.api.ch:8080).

# Partie 5 : Reverse proxy avec apache, configuration dynamique (fb-dynamic-configuration)

Un des problèmes fondamentaux avec notre infrastructure telle que nous l'avons laissée à la fin de la partie 4, est le fait que nous avons codé "en dur" les adresses IP dans le fichier de configuration de notre reverse proxy. Cette solution, bien que fonctionnelle sous certaines conditions, est non seulement peu élégante, mais surtout extrêmement fragile. En effet, elle implique de lancer les containers dans un ordre précis et nécessite de vérifier à la main que les adresses IP attribuées aux containers sont bien celles auxquelles on s'attend. Rien ne nous garantit qu'elles seront effectivement les bonnes !

Cette partie 5 nous permet donc de corriger ce problème en introduisant plus de flexibilté, car l'adresse ip des deux containers sera fournie dynamiquement au moment du lancement du reverse proxy, via l'utilisation de variables d'environnement, et non plus statiquement dans des fichiers de configuration.

Afin de communiquer entre l'intérieur et l'extérieur du container, nous avons décidé d'utiliser des variables d'environnement. Une variable STATIC_APP afin de récupérer l'adresse ip de notre serveur web statique, et une variable DYNAMIC_APP pour l'adresse du serveur dynamique. Avec le flag -e de la commande docker run, nous pouvons démarrer un container en lui passant des variables d'environnement initialisées. À l'intérieur du container du reverse-proxy, le script php décrit ci-dessous pourra récupérer les valeurs desdites variables, pour pouvoir ensuite les injecter dans le fichier de configuration.

Notre propre script php cité ci-dessus, templates/config-template.php, récupère les deux variables avec la fonction php getenv( ), et print les variables dans le script de configuration de l'étape 3.

Afin de générer dynamiquement notre fichier de configuration au démarrage du container, il est important d'observer comment est construite l'image php choisie pour notre reverse-proxy. Dans le Dockerfile de l'image, nous pouvons observer que la dernière instruction et le fait d'exécuter le script apache2-foreground au démarrage du container. Ce que nous avons fait, c'est reprendre ce script, que nous trouvons ici : [php:7.2/apache2-foreground](https://github.com/docker-library/php/blob/fbba7966bc4ca30a8bb2482cd694a798a50f4406/7.2/buster/apache/apache2-foreground), et de le modifier pour y ajouter l'exécution de notre propre script qui génère le fichier de configuration 001-reverse-proxy.conf à partir des variables d'environnement. 

Dans le Dockerfile du reverse-proxy, il faut également copier la nouvelle version de apache2-foreground au bon endroit dans l'image, à savoir dans /usr/local/bin/ et d'ajouter le script php dans /var/apache2/templates.

Finalement, nous pouvons reconstruire l'image du reverse-proxy pour prendre en compte les modifications : 

    docker build -t api/api-rp .

Puis, de manière similaire aux parties 3 et 4, nous pouvons tester notre infrastructure en suivant la procédure suivante, en assumant qu'aucun container n'est en cours d'exécution :
    
    docker run -d --name api-static api/api-static
    docker run -d --name api-dynamic api/api-dynamic
    
Un fois ces deux service lancés, nous pouvons trouver leur adresse ip avec :

    docker inspect api-static | grep -i ipaddr
    docker inspect api-dynamic | grep -i ipaddr

Et introduire finalement le résultat dans les variables d'environnements : 

    docker run -d -e STATIC_APP=172.17.0.2:80 -e DYNAMIC_APP=172.17.0.3:3000 --name api-rp -p 8080:80 api/api-rp
    
Et nous pouvons admirer le resultat à l'adresse [http://demo.api.ch:8080](http://demo.api.ch:8080).

# Partie 6 étapes additionelles

Nous avons mis en place du load-balancing et des sticky sessions à l'aide de docker-compose et traefik

## docker-compose

Docker compose permet de décrire le fonctionnement de plusieurs services faisant partie du même projet. Un fichier docker-compose.yml à la racine du projet décrit les fonctionnement des différent services.

## traefik

Nous avons pris une image Traefik pour replacer le reverse porxy réalisé à l'étape précèdente. Cela facilite le travail car traefik s'occupe de trouver les adresses des containers et les déploye selon les informations données dans la partie labels.

Cette ligne permet de donner l'adresse du site et oũ il doit être placé. Ici se sera à l'adresse [http://demo.api.ch:8080](http://demo.api.ch:8080). Le port est spécificé dans le service reverse-proxy.

    - "traefik.http.routers.apache_static.rule=Host(`demo.api.ch`) && PathPrefix(`/`)"

Pour le site dynamique il a fallu préciser sur quel port le script écoute.

    - "traefik.http.services.express_dynamic.loadbalancer.server.port=3000"

Le loadbalancing se fait avec cette ligne.

    - "traefik.http.services.apache_static.loadbalancer.sticky=true"

