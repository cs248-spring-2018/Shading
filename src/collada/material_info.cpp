#include "material_info.h"

using namespace std;

namespace CS248 {
namespace Collada {

std::ostream& operator<<(std::ostream& os, const MaterialInfo& material) {
  os << "MaterialInfo: " << material.name << " (id:" << material.id << ")";

  os << " ["
     << " BSDF=" << material.bsdf << " ]";

  return os;
}

}  // namespace Collada
}  // namespace CS248
