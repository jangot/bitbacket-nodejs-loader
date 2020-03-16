Cli for getting npm versions of all packages in your Bitbacket 
=================

How it works?
-------------------------------------

1. `yarn install`

2. Run command `yarn load --user {bitbacketUserName} --password {bitbacketPassword} --host {youBitbacketHost}` for loading `package.json` from available repositories.

3. Run command `yarn show`

By default `show` will show only `lodash` versions.

But you can pass dependencies that will be show in result:
`yarn show --package=axios --package=lodash`

Show links
`yarn show -p lodash -p lodash -l`

Filter by last commit:

`yarn show -d 90` - will apply filter by last 30 days
