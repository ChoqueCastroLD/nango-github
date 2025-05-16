# nango-github

Test github-stars locally with validation

nango dryrun github-stars test-connection-id -m '{"owner":"ChoqueCastroLD","repo":"nango-github"}' --validation

Test github-commits locally with validation

nango dryrun github-commits test-connection-id -m '{"owner":"ChoqueCastroLD","repo":"nango-github"}' --validation

Test github-pullrequests locally with validation

nango dryrun github-pullrequests test-connection-id -m '{"owner":"NangoHQ","repo":"datadog-agent"}' --validation
