while true; do
  start_time=$SECONDS
  npm run parse_continually
  npm run deploylive

  time_diff=$(( 3600 - ( $SECONDS-$start_time ) ))
  echo "Time left after deploy: ${time_diff}s"
  sleep $(( time_diff > 0 ? $time_diff : 0 ))
done