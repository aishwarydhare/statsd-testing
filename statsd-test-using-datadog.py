from datadog import initialize, statsd
import time

options = {
    'statsd_host': '127.0.0.1',
    'statsd_port': 8125
}

initialize(**options)

while (1):
    statsd.increment('example_metric.increment', tags=["environment:dev"])
    statsd.decrement('example_metric.decrement', tags=["environment:dev"])
    time.sleep(0.2)
