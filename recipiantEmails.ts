// The users defined in this list will be allowed to create
// an admin account on the server.
// They'll need to confirm their email address before being
// able to log in.
const adminsWhitelist = new Set<string>([
	'fm.de.jouvencel@gmail.com',
	/* Disabled for now, until it works well enough
	'mcurmei@berkeley.edu',
	'haupt@mit.edu',
	'marc.faddoul@berkeley.edu',
	*/
]);

export default adminsWhitelist;
