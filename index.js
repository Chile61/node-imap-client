var Imap = require('imap'),
    inspect = require('util').inspect;
var fs = require('fs'), fileStream;
var MailParser = require('mailparser').MailParser;

var mailConfig =  require('./config').mail;
mailConfig.password = process.argv[2]
var imap = new Imap(mailConfig);

function openInbox(cb) {
  imap.openBox('INBOX', true, cb);
}

imap.once('ready', function() {
    openInbox(function(err, box) {
        if (err) throw err;
        imap.search([ 'UNSEEN', ['SINCE', 'Aug 22, 2017'] ], function(err, results) {
            if (err) throw err;
            var f = imap.fetch(results, { bodies: '' });

            f.on('message',processMessage);
            // f.on('message', function(msg, seqno) {

            //     console.log('Message #%d', seqno);
            //     console.log('Msg',msg);
            //     msg.on('body', function(stream, info) {
            //         console.log(prefix + 'Body');
            //         stream.pipe(fs.createWriteStream('./mails/msg-' + seqno + '-body.txt'));
            //     });
            //     msg.once('attributes', function(attrs) {
            //         console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
            //     });
            //     msg.once('end', function() {
            //         console.log(prefix + 'Finished');
            //     });
            // });
            f.once('error', function(err) {
            console.log('Fetch error: ' + err);
            });
            f.once('end', function() {
            console.log('Done fetching all messages!');
            imap.end();
            });
        });
        });
});

imap.once('error', function(err) {
  console.log(err);
});

imap.once('end', function() {
  console.log('Connection ended');
});

imap.connect();

/// Parse message

function processMessage(msg, seqno) {
    console.log("Processing msg #" + seqno);
    // console.log(msg);

    var parser = new MailParser();
    parser.on("headers", function(headers) {
        console.log("Header: " + JSON.stringify(headers));
    });

    parser.on('data', data => {
        if (data.type === 'text') {
            console.log(seqno);
            if(data.text) {

                console.log(data.text)
            }
            if(data.html){
                console.log(data.html);  /* data.html*/
            }
            
        }

        // if (data.type === 'attachment') {
        //     console.log(data.filename);
        //     data.content.pipe(process.stdout);
        //     // data.content.on('end', () => data.release());
        // }
     });

    msg.on("body", function(stream) {
        stream.on("data", function(chunk) {
            parser.write(chunk.toString("utf8"));
        });
    });
    msg.once("end", function() {
        // console.log("Finished msg #" + seqno);
        parser.end();
    });
}