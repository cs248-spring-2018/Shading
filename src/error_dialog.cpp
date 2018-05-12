#include "error_dialog.h"

#include "CS248/viewer.h"

namespace CS248 {

// Simple passthrough function to hide cass member function call
void showError(std::string errorString, bool fatal) {
  Viewer::showError(errorString, fatal);
}

}  // namespace CS248
