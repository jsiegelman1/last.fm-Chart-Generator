## Last.fm Chart Generator
A simple website that creates top charts from Last.fm data. In addition to overall top albums, you can also generate a top chart from a given Last.fm tag.

## How to use
Fork the Repo and run `npm start` to start the server. Then, enter your last.fm username and generate your desired chart. There are limits on last.fm's API, so the first time you generate a chart it might not work correctly, but results are cached so subsequent charts should generate correctly.

## Types of Chart
A top chart will show your most listened to albums. A top chart for a certain tag will show your most listened to albums with a certain tag. A sample chart will compute the most common tags of your top 100 albums and then return your top album with each tag, this should give more variety if your normal top chart is mostly one genre.

## Hey, that album shouldn't have that tag!
Last.fm's tags are all user-generated, and they can get weird. Sorry.
