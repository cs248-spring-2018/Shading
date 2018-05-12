#ifndef CS248_ERROR_DIALOG_H
#define CS248_ERROR_DIALOG_H

#include <string>

namespace CS248 {

void showError(std::string errorString, bool fatal = false);

}  // namespace CS248

#endif  // CS248_ERROR_DIALOG_H
