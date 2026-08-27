const bcrypt = require('bcryptjs');

async function checkPass() {
  const isMatch = await bcrypt.compare('Teacher@123', '$2a$10$dhGh.t2dAWGSBEnpDbsA.O20uZr5WeQlFk0IGL0lG7xEgN6uH9rJu');
  console.log('Match Teacher@123?', isMatch);
}
checkPass();
