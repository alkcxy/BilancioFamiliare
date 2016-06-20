#!/usr/bin/env bash
inizio=`date +%s`

echo "localhost:3000 localhost:3000/eventi localhost:3000/tags/visita-guidata localhost:3000/eventi/tanti-lati-latitanti-ale-e-franz-all-ambra-jovinelli localhost:3000/eventi/segnala localhost:3000/suggerimento/nuovo localhost:3000/newsletters localhost:3000/newsletters localhost:3000/newsletters/208 localhost:3000/calendario/2016/01/13 localhost:3000/signin" | xargs -n 1 -P 8 wget -O /dev/null

fine=`date +%s`
echo "Operazione eseguita in $(($fine-$inizio)) secondi" 

